import { supabase } from '@/integrations/supabase/client';
import { AutoRequirement } from '@/components/maintenance/template-builder/types';

interface TaskCreationData {
  jobId: string;
  customerId: string;
  siteId?: string;
  unitId?: string;
  unitNumber?: string;
  ruleName: string;
  ruleId: string;
  triggeredBy: string;
  description: string;
  photos?: string[];
  notes?: string;
  dueInDays?: number;
  assignedTo?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export const createAutomatedTask = async (data: TaskCreationData) => {
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + (data.dueInDays || 3));

  const taskTitle = data.unitNumber 
    ? `[${data.unitNumber}] ${data.ruleName}`
    : data.ruleName;

  const taskDescription = `Auto-generated from: ${data.ruleName}\n\n${data.description}`;

  const { data: task, error } = await (supabase as any)
    .from('maintenance_tasks')
    .insert({
      title: taskTitle,
      description: taskDescription,
      job_id: data.jobId,
      customer_id: data.customerId,
      site_id: data.siteId,
      unit_id: data.unitId,
      due_date: dueDate.toISOString(),
      priority: data.priority || 'medium',
      status: 'pending',
      assigned_to: data.assignedTo,
      created_by: 'automation',
      automation_rule_id: data.ruleId,
      metadata: {
        triggered_by: data.triggeredBy,
        photos: data.photos || [],
        notes: data.notes,
      },
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create automated task:', error);
    throw error;
  }

  return task;
};

export const sendNotification = async (
  type: 'email' | 'sms',
  recipients: string[],
  subject: string,
  body: string,
  metadata?: any
) => {
  // This would integrate with your notification system (e.g., edge function)
  // For now, just log it
  console.log('Notification:', { type, recipients, subject, body, metadata });
  
  // Example: Call edge function for email/SMS
  // const { error } = await supabase.functions.invoke('send-notification', {
  //   body: { type, recipients, subject, body, metadata },
  // });
  
  return { success: true };
};

export const processAutoActions = async (
  requirement: AutoRequirement,
  formData: any,
  context: {
    jobId: string;
    customerId: string;
    siteId?: string;
    unitId?: string;
    unitNumber?: string;
    techId: string;
    photos?: string[];
    notes?: string;
  }
) => {
  const actions: { type: string; result: any }[] = [];

  if (requirement.auto_actions?.create_task) {
    try {
      const task = await createAutomatedTask({
        jobId: context.jobId,
        customerId: context.customerId,
        siteId: context.siteId,
        unitId: context.unitId,
        unitNumber: context.unitNumber,
        ruleName: requirement.name,
        ruleId: requirement.id,
        triggeredBy: context.techId,
        description: requirement.description || '',
        photos: context.photos,
        notes: context.notes,
        dueInDays: requirement.auto_actions.due_days,
        priority: 'medium',
      });

      actions.push({ type: 'task_created', result: task });
    } catch (error) {
      console.error('Failed to create task:', error);
      actions.push({ type: 'task_creation_failed', result: error });
    }
  }

  if (requirement.auto_actions?.notify && requirement.auto_actions.notify.length > 0) {
    try {
      const notificationBody = `
Alert from ${requirement.name}

Job: ${context.jobId}
${context.unitNumber ? `Unit: ${context.unitNumber}` : ''}

${requirement.description}

${context.notes ? `Notes: ${context.notes}` : ''}
      `.trim();

      await sendNotification(
        'email',
        requirement.auto_actions.notify,
        `Alert: ${requirement.name}`,
        notificationBody,
        {
          jobId: context.jobId,
          unitId: context.unitId,
          ruleId: requirement.id,
          photos: context.photos,
        }
      );

      actions.push({ type: 'notification_sent', result: { recipients: requirement.auto_actions.notify } });
    } catch (error) {
      console.error('Failed to send notification:', error);
      actions.push({ type: 'notification_failed', result: error });
    }
  }

  return actions;
};
