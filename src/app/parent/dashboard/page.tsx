
"use client";

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { FileText, TrendingUp, Star, AlertTriangle, Activity, Calendar } from 'lucide-react';

export default function ParentDashboardPage() {
  return (
    <div className="space-y-8 py-8">
      <header>
        <h1 className="text-3xl font-bold text-primary">Parent Dashboard</h1>
        <p className="text-muted-foreground">Monitor your child's learning journey and progress.</p>
      </header>

      {/* Weekly Report Summary */}
      <section>
        <Card className="shadow-lg border-primary/20 bg-primary/5">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Latest Weekly Report
              </CardTitle>
              <CardDescription>Week of Oct 20 - Oct 26, 2024</CardDescription>
            </div>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Generated 2 days ago
            </Badge>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="text-foreground/80 leading-relaxed">
                Your child has shown consistent effort this week, particularly in the "Introduction to Python" course.
                They completed 3 mini-tasks and submitted 1 project with an improvement in code clarity compared to last week.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-background p-4 rounded-lg border border-border shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-semibold">Strengths</span>
                </div>
                <ul className="text-xs space-y-1 text-muted-foreground">
                  <li>• Logical problem solving</li>
                  <li>• Consistent daily activity</li>
                </ul>
              </div>
              <div className="bg-background p-4 rounded-lg border border-border shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-semibold">Areas to Improve</span>
                </div>
                <ul className="text-xs space-y-1 text-muted-foreground">
                  <li>• Documentation clarity</li>
                  <li>• Handling edge cases</li>
                </ul>
              </div>
              <div className="bg-background p-4 rounded-lg border border-border shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-semibold">Activity Level</span>
                </div>
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">High</Badge>
                <p className="text-[10px] text-muted-foreground mt-1">Active 5/7 days</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Progress Overview */}
      <div className="grid md:grid-cols-2 gap-8">
        <section>
          <Card className="shadow-lg h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Skill Improvement
              </CardTitle>
              <CardDescription>Growth across different tech domains.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Coding Fundamentals</span>
                  <span className="font-medium">+15%</span>
                </div>
                <Progress value={75} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Problem Solving</span>
                  <span className="font-medium">+8%</span>
                </div>
                <Progress value={62} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>AI Tools Usage</span>
                  <span className="font-medium">+22%</span>
                </div>
                <Progress value={45} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </section>

        <section>
          <Card className="shadow-lg h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Previous Reports
              </CardTitle>
              <CardDescription>Access historical performance data.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {[
                  'Week of Oct 13 - Oct 19',
                  'Week of Oct 06 - Oct 12',
                  'Week of Sep 29 - Oct 05'
                ].map((date, i) => (
                  <li key={i} className="flex items-center justify-between p-3 border rounded hover:bg-muted/50 transition-colors cursor-pointer">
                    <span className="text-sm">{date}</span>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
