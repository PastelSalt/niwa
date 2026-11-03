import AutoStoriesOutlined from '@mui/icons-material/AutoStoriesOutlined';
import CalendarMonthOutlined from '@mui/icons-material/CalendarMonthOutlined';
import InboxOutlined from '@mui/icons-material/InboxOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import TaskAltOutlined from '@mui/icons-material/TaskAltOutlined';
import { useSearchParams } from 'react-router';
import { PagePlaceholder } from '../components/PagePlaceholder.tsx';

/** Landing pages for destinations whose features arrive in later milestones. */

export function KnowledgePage() {
  return (
    <PagePlaceholder
      icon={<AutoStoriesOutlined />}
      title="Your notebook garden"
      description="Notes, topics and reference pages with outlines, links and backlinks."
      milestone="M4"
    />
  );
}

export function ActionablePage() {
  return (
    <PagePlaceholder
      icon={<TaskAltOutlined />}
      title="Focus"
      description="In progress, high priority, overdue, upcoming and recently updated work across every project."
      milestone="M3"
    />
  );
}

export function SchedulerPage() {
  return (
    <PagePlaceholder
      icon={<CalendarMonthOutlined />}
      title="Plan your month"
      description="Month and week views for events and time blocks. NIWA is your only calendar."
      milestone="M5"
    />
  );
}

export function InboxPage() {
  return (
    <PagePlaceholder
      icon={<InboxOutlined />}
      title="Capture first, decide later"
      description="Everything you capture lands here until you file it into the tree."
      milestone="M6"
    />
  );
}

export function SearchPage() {
  const [params] = useSearchParams();
  const q = params.get('q');
  return (
    <PagePlaceholder
      icon={<SearchOutlined />}
      title={q ? `Search for “${q}”` : 'One search for everything'}
      description="Titles, tags and note bodies across all bases."
      milestone="M6"
    />
  );
}
