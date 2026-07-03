
import { db } from './firebase';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  orderBy,
  limit
} from 'firebase/firestore';
import { UserProfile, getUserProfile } from './auth';
import { Progress } from '@/types/progress';
import { Submission } from '@/types/submission';
import { ParentReportInput } from '@/ai/flows/generate-parent-report';
import { Course, Lesson, Project } from '@/types/course';

/**
 * Links a student to a parent using the student's email.
 */
export async function linkStudentToParent(parentId: string, studentEmail: string): Promise<{ success: boolean; error?: string }> {
  if (!db) return { success: false, error: "Firestore not initialized" };

  try {
    // 1. Find student by email
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", studentEmail), where("role", "==", "student"));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { success: false, error: "Student not found with this email." };
    }

    const studentDoc = querySnapshot.docs[0];
    const studentId = studentDoc.id;

    // 2. Add studentId to parent's childrenIds
    const parentDocRef = doc(db, "users", parentId);
    await updateDoc(parentDocRef, {
      childrenIds: arrayUnion(studentId)
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error linking student:", error);
    return { success: false, error: error.message || "Failed to link student" };
  }
}

/**
 * Fetches profiles for all linked students.
 */
export async function getLinkedStudents(childrenIds: string[]): Promise<UserProfile[]> {
  if (!childrenIds || childrenIds.length === 0) return [];

  const profiles = await Promise.all(
    childrenIds.map(id => getUserProfile(id))
  );

  return profiles.filter((p): p is UserProfile => p !== null);
}

/**
 * Aggregates student data for the AI report generator.
 */
export async function fetchStudentDataForReport(studentId: string): Promise<ParentReportInput | null> {
  if (!db) return null;

  try {
    const studentProfile = await getUserProfile(studentId);
    if (!studentProfile) return null;

    // 1. Fetch all progress documents
    const progressRef = collection(db, "users", studentId, "progress");
    const progressSnapshot = await getDocs(progressRef);
    const progressList = progressSnapshot.docs.map(doc => doc.data() as Progress);

    // 2. Fetch recent submissions
    const submissionsRef = collection(db, "submissions");
    const qSubmissions = query(
      submissionsRef,
      where("studentId", "==", studentId),
      orderBy("updatedAt", "desc"),
      limit(5)
    );
    const submissionsSnapshot = await getDocs(qSubmissions);
    const submissions = submissionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Submission));

    // 3. Aggregate Skills
    const skillsMap: Record<string, { currentLevel: number; improvement: number }> = {};
    progressList.forEach(p => {
      p.skills?.forEach(s => {
        if (!skillsMap[s.skillName] || skillsMap[s.skillName].currentLevel < s.level) {
          // Simplified improvement calculation for demo
          // In a real app, we'd compare with previous week's data
          const mockImprovement = Math.floor(Math.random() * 15) + 5;
          skillsMap[s.skillName] = {
            currentLevel: s.level,
            improvement: mockImprovement
          };
        }
      });
    });

    // 4. Map Recent Activity
    // We need to fetch titles for lessons and projects
    // We'll use Promise.all to fetch titles in parallel for efficiency
    const recentActivity: ParentReportInput['recentActivity'] = [];

    const submissionActivityPromises = submissions.map(async (sub) => {
      const projectDoc = await getDoc(doc(db!, "courses", sub.courseId, "projects", sub.projectId));
      const projectData = projectDoc.data() as Project;

      return {
        type: 'project' as const,
        title: projectData?.title || 'Unknown Project',
        status: sub.status,
        feedback: sub.feedback?.[0]?.content
      };
    });

    const submissionActivities = await Promise.all(submissionActivityPromises);
    recentActivity.push(...submissionActivities);

    // Add some completed lessons to activity
    const lastProgress = progressList.sort((a, b) => {
        const dateA = typeof a.lastActivityAt === 'string' ? new Date(a.lastActivityAt).getTime() : (a.lastActivityAt as any).seconds * 1000;
        const dateB = typeof b.lastActivityAt === 'string' ? new Date(b.lastActivityAt).getTime() : (b.lastActivityAt as any).seconds * 1000;
        return dateB - dateA;
    })[0];

    if (lastProgress && lastProgress.completedLessons.length > 0) {
        // Take up to 3 most recent lessons
        const recentLessonIds = lastProgress.completedLessons.slice(-3);
        const lessonActivityPromises = recentLessonIds.map(async (lessonId) => {
            const lessonDoc = await getDoc(doc(db!, "courses", lastProgress.courseId, "lessons", lessonId));
            const lessonData = lessonDoc.data() as Lesson;
            if (lessonData) {
                return {
                    type: 'lesson' as const,
                    title: lessonData.title,
                    status: 'completed'
                };
            }
            return null;
        });

        const lessonActivities = (await Promise.all(lessonActivityPromises)).filter((a): a is any => a !== null);
        recentActivity.push(...lessonActivities);
    }

    return {
      studentName: studentProfile.displayName || studentProfile.email || "Student",
      recentActivity: recentActivity.slice(0, 5),
      skills: Object.entries(skillsMap).map(([name, data]) => ({
        name,
        currentLevel: data.currentLevel,
        improvement: data.improvement
      }))
    };
  } catch (error) {
    console.error("Error fetching student data for report:", error);
    return null;
  }
}
