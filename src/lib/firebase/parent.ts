
import { db } from './firebase';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  arrayUnion,
  getDoc,
  orderBy,
  limit
} from 'firebase/firestore';
import { UserProfile } from './auth';
import { Progress } from '@/types/progress';
import { Submission } from '@/types/submission';

export async function linkStudentToParent(parentUid: string, studentEmail: string): Promise<{ success: boolean; error?: string }> {
  if (!db) return { success: false, error: 'Database not initialized' };
  try {
    // 1. Find the student by email
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', studentEmail), where('role', '==', 'student'));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { success: false, error: 'Student not found with that email.' };
    }

    const studentDoc = querySnapshot.docs[0];
    const studentUid = studentDoc.id;

    // 2. Update the parent's document
    const parentDocRef = doc(db, 'users', parentUid);
    await updateDoc(parentDocRef, {
      childrenIds: arrayUnion(studentUid)
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error linking student to parent:', error);
    return { success: false, error: error.message || 'Failed to link student.' };
  }
}

export async function getStudentActivityData(studentUid: string) {
  if (!db) throw new Error('Database not initialized');
  try {
    // 1. Get student profile for name
    const studentDoc = await getDoc(doc(db, 'users', studentUid));
    if (!studentDoc.exists()) throw new Error('Student not found');
    const studentProfile = studentDoc.data() as UserProfile;

    // 2. Get progress data (for skills)
    const progressRef = collection(db, 'users', studentUid, 'progress');
    const progressSnapshot = await getDocs(progressRef);
    const progressDocs = progressSnapshot.docs.map(doc => doc.data() as Progress);

    // 3. Get recent submissions
    const submissionsRef = collection(db, 'submissions');
    const qSubmissions = query(
      submissionsRef,
      where('studentId', '==', studentUid),
      orderBy('updatedAt', 'desc'),
      limit(10)
    );
    const submissionsSnapshot = await getDocs(qSubmissions);
    const submissions = submissionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Submission));

    // Aggregate skills (take the highest level seen for each skill name)
    const skillsMap: Record<string, { currentLevel: number; improvement: number }> = {};
    progressDocs.forEach(p => {
      p.skills?.forEach(s => {
        if (!skillsMap[s.skillName] || skillsMap[s.skillName].currentLevel < s.level) {
          // We don't easily have "improvement" historical data here without more complex queries
          // For now, we'll estimate or use a default
          skillsMap[s.skillName] = {
            currentLevel: s.level,
            improvement: 5 // Default placeholder for improvement
          };
        }
      });
    });

    const formattedSkills = Object.entries(skillsMap).map(([name, data]) => ({
      name,
      currentLevel: data.currentLevel,
      improvement: data.improvement
    }));

    // Format recent activity
    const recentActivity: { type: 'lesson' | 'project'; title: string; status: string; feedback?: string }[] = [];

    submissions.forEach(s => {
      const latestFeedback = s.feedback && s.feedback.length > 0
        ? s.feedback[s.feedback.length - 1].content
        : undefined;

      recentActivity.push({
        type: 'project',
        title: `Project in ${s.courseId}`,
        status: s.status,
        feedback: latestFeedback
      });
    });

    // Add some completed lessons if any
    progressDocs.forEach(p => {
      p.completedLessons?.slice(0, 3).forEach(lessonId => {
        recentActivity.push({
          type: 'lesson',
          title: `Lesson ${lessonId}`,
          status: 'completed',
          feedback: undefined
        });
      });
    });

    return {
      studentName: studentProfile.displayName || 'Your Child',
      recentActivity: recentActivity.slice(0, 10),
      skills: formattedSkills.length > 0 ? formattedSkills : [
        { name: 'General Progress', currentLevel: 50, improvement: 5 }
      ]
    };

  } catch (error) {
    console.error('Error fetching student activity data:', error);
    throw error;
  }
}
