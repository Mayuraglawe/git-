import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  CheckCircle2, Circle, Clock, Calendar as CalendarIcon, 
  Plus, Trash2, Edit, ListTodo, AlertCircle 
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export interface Task {
  id: string;
  title: string;
  description?: string;
  due_date?: Date;
  due_time?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  event_id?: string; // Link to related event
  created_at: Date;
  completed_at?: Date;
}

interface TaskManagerProps {
  onTasksChange?: (tasks: Task[]) => void;
  linkedEventId?: string;
}

const PRIORITY_COLORS = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800'
};

export default function TaskManager({ onTasksChange, linkedEventId }: TaskManagerProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '',
    description: '',
    priority: 'medium',
    completed: false,
    event_id: linkedEventId
  });

  const handleAddTask = () => {
    if (!newTask.title?.trim()) return;

    const task: Task = {
      id: Date.now().toString(),
      title: newTask.title,
      description: newTask.description,
      due_date: newTask.due_date,
      due_time: newTask.due_time,
      completed: false,
      priority: newTask.priority || 'medium',
      event_id: newTask.event_id,
      created_at: new Date()
    };

    const updatedTasks = [...tasks, task];
    setTasks(updatedTasks);
    onTasksChange?.(updatedTasks);
    
    // Save to localStorage
    saveTasks(updatedTasks);
    
    // Reset form
    setNewTask({
      title: '',
      description: '',
      priority: 'medium',
      completed: false,
      event_id: linkedEventId
    });
    setIsAddDialogOpen(false);
  };

  const toggleTaskCompletion = (taskId: string) => {
    const updatedTasks = tasks.map(task =>
      task.id === taskId
        ? {
            ...task,
            completed: !task.completed,
            completed_at: !task.completed ? new Date() : undefined
          }
        : task
    );
    setTasks(updatedTasks);
    onTasksChange?.(updatedTasks);
    saveTasks(updatedTasks);
  };

  const deleteTask = (taskId: string) => {
    const updatedTasks = tasks.filter(task => task.id !== taskId);
    setTasks(updatedTasks);
    onTasksChange?.(updatedTasks);
    saveTasks(updatedTasks);
  };

  const saveTasks = (tasks: Task[]) => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  };

  const loadTasks = () => {
    try {
      const saved = localStorage.getItem('tasks');
      if (saved) {
        const loaded = JSON.parse(saved);
        setTasks(loaded.map((t: any) => ({
          ...t,
          created_at: new Date(t.created_at),
          due_date: t.due_date ? new Date(t.due_date) : undefined,
          completed_at: t.completed_at ? new Date(t.completed_at) : undefined
        })));
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  React.useEffect(() => {
    loadTasks();
  }, []);

  const pendingTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);
  const overdueTasks = pendingTasks.filter(t => 
    t.due_date && new Date(t.due_date) < new Date()
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ListTodo className="h-5 w-5" />
              Tasks & To-Do List
            </CardTitle>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Task
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Task</DialogTitle>
                  <DialogDescription>
                    Add a task with optional deadline to track your to-dos
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="task-title">Task Title*</Label>
                    <Input
                      id="task-title"
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                      placeholder="Complete project proposal"
                    />
                  </div>
                  <div>
                    <Label htmlFor="task-description">Description</Label>
                    <Textarea
                      id="task-description"
                      value={newTask.description}
                      onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                      placeholder="Additional details..."
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Due Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {newTask.due_date ? format(newTask.due_date, 'PPP') : 'Pick date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={newTask.due_date}
                            onSelect={(date) => setNewTask({ ...newTask, due_date: date })}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div>
                      <Label htmlFor="task-time">Due Time</Label>
                      <Input
                        id="task-time"
                        type="time"
                        value={newTask.due_time}
                        onChange={(e) => setNewTask({ ...newTask, due_time: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Priority</Label>
                    <div className="flex gap-2 mt-2">
                      {(['low', 'medium', 'high'] as const).map((priority) => (
                        <Button
                          key={priority}
                          type="button"
                          variant={newTask.priority === priority ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setNewTask({ ...newTask, priority })}
                          className="capitalize"
                        >
                          {priority}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddTask}>
                      Create Task
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Statistics */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{pendingTasks.length}</div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{completedTasks.length}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{overdueTasks.length}</div>
              <div className="text-sm text-muted-foreground">Overdue</div>
            </div>
          </div>

          {/* Pending Tasks */}
          {pendingTasks.length > 0 && (
            <div className="space-y-2 mb-4">
              <h4 className="font-semibold text-sm text-muted-foreground">Pending Tasks</h4>
              {pendingTasks.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={toggleTaskCompletion}
                  onDelete={deleteTask}
                />
              ))}
            </div>
          )}

          {/* Completed Tasks */}
          {completedTasks.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-muted-foreground">Completed Tasks</h4>
              {completedTasks.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={toggleTaskCompletion}
                  onDelete={deleteTask}
                />
              ))}
            </div>
          )}

          {tasks.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <ListTodo className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No tasks yet. Click "Add Task" to create one.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TaskItem({ 
  task, 
  onToggle, 
  onDelete 
}: { 
  task: Task; 
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const isOverdue = task.due_date && !task.completed && new Date(task.due_date) < new Date();

  return (
    <div className={cn(
      "flex items-start gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors",
      task.completed && "opacity-60"
    )}>
      <button
        onClick={() => onToggle(task.id)}
        className="mt-0.5"
      >
        {task.completed ? (
          <CheckCircle2 className="h-5 w-5 text-green-600" />
        ) : (
          <Circle className="h-5 w-5 text-muted-foreground" />
        )}
      </button>

      <div className="flex-1">
        <div className={cn(
          "font-medium",
          task.completed && "line-through text-muted-foreground"
        )}>
          {task.title}
        </div>
        {task.description && (
          <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
        )}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <Badge className={PRIORITY_COLORS[task.priority]} variant="outline">
            {task.priority}
          </Badge>
          {task.due_date && (
            <Badge variant="outline" className={isOverdue ? 'border-red-500 text-red-600' : ''}>
              <Clock className="h-3 w-3 mr-1" />
              {format(task.due_date, 'MMM d')}
              {task.due_time && ` at ${task.due_time}`}
              {isOverdue && <AlertCircle className="h-3 w-3 ml-1" />}
            </Badge>
          )}
        </div>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDelete(task.id)}
        className="text-red-600 hover:text-red-700"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
