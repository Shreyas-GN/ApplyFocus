import { StackHandler } from '@stackframe/stack';
import { stackServerApp } from '@/lib/auth/stack-server';

export default function Handler(props: {
  params: Promise<{ stack: string[] }>;
  searchParams: Promise<Record<string, string>>;
}) {
  return <StackHandler app={stackServerApp} routeProps={props} fullPage />;
}
