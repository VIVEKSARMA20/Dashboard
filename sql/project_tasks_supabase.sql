-- Run in Supabase SQL Editor (or use: npx prisma db push / migrate)
-- Matches prisma/schema.prisma @@map("project_tasks")

CREATE TABLE IF NOT EXISTS project_tasks (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL UNIQUE,
  description TEXT,
  status TEXT,
  priority TEXT,
  due_date TIMESTAMPTZ(6),
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_tasks_task_id ON project_tasks (task_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_status ON project_tasks (status);
CREATE INDEX IF NOT EXISTS idx_project_tasks_due_date ON project_tasks (due_date);
