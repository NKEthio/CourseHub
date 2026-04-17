export default function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-6 text-center">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} CourseHub. All rights reserved.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Empowering lifelong learning.
        </p>
      </div>
    </footer>
  );
}
