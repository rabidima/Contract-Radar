import { createFileRoute, Link } from "@tanstack/react-router";
import { ChapterView } from "@/components/playbook/chapter-view";
import { chapterBySlug } from "@/lib/playbook/content";

export const Route = createFileRoute("/playbook/$slug")({ component: ChapterPage });

function ChapterPage() {
  const { slug } = Route.useParams();
  const chapter = chapterBySlug(slug);
  if (!chapter) {
    return (
      <div className="px-4 py-16 text-center">
        <p className="font-display text-2xl">Chapter not found</p>
        <Link to="/playbook" className="mt-4 inline-flex h-11 items-center text-sm text-accent">
          Back to playbook
        </Link>
      </div>
    );
  }
  return <ChapterView chapter={chapter} />;
}
