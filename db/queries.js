// db/queries.js
// =============================================================================
//  All 15 query functions — fully implemented.
// =============================================================================

const { ObjectId } = require('mongodb');

// =============================================================================
//  QUERY 1: signupUser
//  Insert a new user. MongoDB unique index on email handles duplicates.
// =============================================================================
async function signupUser(db, userData) {
  const result = await db.collection('users').insertOne({
    name:         userData.name,
    email:        userData.email,
    passwordHash: userData.passwordHash,
    createdAt:    new Date()
  });
  return result;
}

// =============================================================================
//  QUERY 2: loginFindUser
//  Find one user by email. Returns the full document or null.
// =============================================================================
async function loginFindUser(db, email) {
  return await db.collection('users').findOne({ email: email });
}

// =============================================================================
//  QUERY 3: listUserProjects
//  List all non-archived projects for a user, newest first.
// =============================================================================
async function listUserProjects(db, ownerId) {
  return await db.collection('projects')
    .find({
      ownerId:  ownerId,       // already an ObjectId from the route
      archived: false
    })
    .sort({ createdAt: -1 })
    .toArray();
}

// =============================================================================
//  QUERY 4: createProject
//  Insert a new project with defaults for archived and createdAt.
// =============================================================================
async function createProject(db, projectData) {
  const result = await db.collection('projects').insertOne({
    ownerId:     projectData.ownerId,
    name:        projectData.name,
    description: projectData.description || '',
    archived:    false,
    createdAt:   new Date()
  });
  return result;
}

// =============================================================================
//  QUERY 5: archiveProject
//  Set archived: true on one project. Does not delete it.
// =============================================================================
async function archiveProject(db, projectId) {
  return await db.collection('projects').updateOne(
    { _id: projectId },       // already an ObjectId from the route
    { $set: { archived: true } }
  );
}

// =============================================================================
//  QUERY 6: listProjectTasks
//  List tasks for a project. Optionally filter by status.
//  Sorted by priority descending, then createdAt descending.
// =============================================================================
async function listProjectTasks(db, projectId, status) {
  // Build filter — start with projectId, add status only if given
  const filter = { projectId: projectId };   // already an ObjectId
  if (status) {
    filter.status = status;
  }

  return await db.collection('tasks')
    .find(filter)
    .sort({ priority: -1, createdAt: -1 })
    .toArray();
}

// =============================================================================
//  QUERY 7: createTask
//  Insert a new task. Embedded subtasks and tags arrays live inside the doc.
// =============================================================================
async function createTask(db, taskData) {
  const result = await db.collection('tasks').insertOne({
    ownerId:   taskData.ownerId,
    projectId: taskData.projectId,
    title:     taskData.title,
    status:    'todo',
    priority:  taskData.priority  ?? 1,
    tags:      taskData.tags      ?? [],
    subtasks:  taskData.subtasks  ?? [],
    createdAt: new Date()
  });
  return result;
}

// =============================================================================
//  QUERY 8: updateTaskStatus
//  Change the status field of one task.
// =============================================================================
async function updateTaskStatus(db, taskId, newStatus) {
  return await db.collection('tasks').updateOne(
    { _id: taskId },          // already an ObjectId
    { $set: { status: newStatus } }
  );
}

// =============================================================================
//  QUERY 9: addTaskTag
//  Add a tag to the tags array — $addToSet silently skips duplicates.
// =============================================================================
async function addTaskTag(db, taskId, tag) {
  return await db.collection('tasks').updateOne(
    { _id: taskId },
    { $addToSet: { tags: tag } }
  );
}

// =============================================================================
//  QUERY 10: removeTaskTag
//  Remove a tag from the tags array. $pull removes all matching values.
// =============================================================================
async function removeTaskTag(db, taskId, tag) {
  return await db.collection('tasks').updateOne(
    { _id: taskId },
    { $pull: { tags: tag } }
  );
}

// =============================================================================
//  QUERY 11: toggleSubtask
//  Flip the done field on ONE embedded subtask matched by title.
//  The $ positional operator updates only the first array element that matched.
// =============================================================================
async function toggleSubtask(db, taskId, subtaskTitle, newDone) {
  return await db.collection('tasks').updateOne(
    {
      _id:             taskId,          // find the right task
      'subtasks.title': subtaskTitle    // AND the right subtask inside it
    },
    {
      $set: { 'subtasks.$.done': newDone }   // $ = the matched subtask
    }
  );
}

// =============================================================================
//  QUERY 12: deleteTask
//  Permanently delete one task by its _id.
// =============================================================================
async function deleteTask(db, taskId) {
  return await db.collection('tasks').deleteOne({ _id: taskId });
}

// =============================================================================
//  QUERY 13: searchNotes
//  Find notes for a user that contain ANY of the given tags.
//  $in checks if the tags array field contains at least one of the values.
//  Optionally restrict to one project.
// =============================================================================
async function searchNotes(db, ownerId, tags, projectId) {
  const filter = {
    ownerId: ownerId,
    tags:    { $in: tags }    // note's tags array must contain at least one tag
  };

  // Only add projectId to filter if the caller passed one
  if (projectId) {
    filter.projectId = projectId;
  }

  return await db.collection('notes')
    .find(filter)
    .sort({ createdAt: -1 })
    .toArray();
}

// =============================================================================
//  QUERY 14: projectTaskSummary
//  Per-project counts of tasks broken down by status, with project name.
//  This is the NoSQL JOIN — uses $lookup to pull project names in.
//
//  Pipeline:
//    1. $match   — only this user's tasks
//    2. $group   — group by projectId, count todo / in-progress / done with $cond
//    3. $lookup  — join projects collection to get the project name
//    4. $unwind  — $lookup returns an array; unwind turns it into a plain object
//    5. $project — reshape into the expected output
// =============================================================================
async function projectTaskSummary(db, ownerId) {
  return await db.collection('tasks').aggregate([

    // Step 1 — keep only this user's tasks
    {
      $match: { ownerId: ownerId }
    },

    // Step 2 — group by projectId, count each status
    {
      $group: {
        _id: '$projectId',
        todo: {
          $sum: { $cond: [{ $eq: ['$status', 'todo'] }, 1, 0] }
        },
        inProgress: {
          $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] }
        },
        done: {
          $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] }
        },
        total: { $sum: 1 }
      }
    },

    // Step 3 — join the projects collection so we can get the project name
    {
      $lookup: {
        from:         'projects',
        localField:   '_id',         // the projectId we grouped by
        foreignField: '_id',         // projects._id
        as:           'project'      // result stored in this array field
      }
    },

    // Step 4 — $lookup returns an array; unwind turns [{...}] into {...}
    {
      $unwind: '$project'
    },

    // Step 5 — rename/reshape fields into the expected output shape
    {
      $project: {
        _id:         1,
        projectName: '$project.name',
        todo:        1,
        inProgress:  1,
        done:        1,
        total:       1
      }
    }

  ]).toArray();
}

// =============================================================================
//  QUERY 15: recentActivityFeed
//  Latest 10 tasks across all of a user's projects, each annotated with the
//  project name. Also uses $lookup.
//
//  Pipeline:
//    1. $match   — only this user's tasks
//    2. $sort    — newest first
//    3. $limit   — keep only 10  (do this BEFORE $lookup to avoid joining everything)
//    4. $lookup  — join projects to get project name
//    5. $unwind  — flatten the 1-element array
//    6. $project — return only the fields the frontend needs
// =============================================================================
async function recentActivityFeed(db, ownerId) {
  return await db.collection('tasks').aggregate([

    // Step 1 — only this user's tasks
    {
      $match: { ownerId: ownerId }
    },

    // Step 2 — newest first
    {
      $sort: { createdAt: -1 }
    },

    // Step 3 — cut to 10 BEFORE joining (much faster)
    {
      $limit: 10
    },

    // Step 4 — join projects collection
    {
      $lookup: {
        from:         'projects',
        localField:   'projectId',
        foreignField: '_id',
        as:           'project'
      }
    },

    // Step 5 — flatten the joined array
    {
      $unwind: '$project'
    },

    // Step 6 — keep only the fields the route/frontend expects
    {
      $project: {
        _id:         1,
        title:       1,
        status:      1,
        priority:    1,
        createdAt:   1,
        projectId:   1,
        projectName: '$project.name'
      }
    }

  ]).toArray();
}

// =============================================================================
//  EXPORTS — do not edit
// =============================================================================
module.exports = {
  signupUser,
  loginFindUser,
  listUserProjects,
  createProject,
  archiveProject,
  listProjectTasks,
  createTask,
  updateTaskStatus,
  addTaskTag,
  removeTaskTag,
  toggleSubtask,
  deleteTask,
  searchNotes,
  projectTaskSummary,
  recentActivityFeed
};