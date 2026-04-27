// seed.js
// =============================================================================
//  Seed the database with realistic test data.
//  Run with: npm run seed
// =============================================================================

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { connect } = require('./db/connection');

(async () => {
  const db = await connect();

  // Clear existing data so re-running seed always gives a clean slate
  await db.collection('users').deleteMany({});
  await db.collection('projects').deleteMany({});
  await db.collection('tasks').deleteMany({});
  await db.collection('notes').deleteMany({});

  console.log('🗑️  Cleared old data');

  // ─── USERS ──────────────────────────────────────────────────────────────────
  const aliceHash = await bcrypt.hash('password123', 10);
  const bobHash   = await bcrypt.hash('password456', 10);

  const aliceResult = await db.collection('users').insertOne({
    name:         'Alice Johnson',
    email:        'alice@example.com',
    passwordHash: aliceHash,
    createdAt:    new Date('2024-01-10')
  });

  const bobResult = await db.collection('users').insertOne({
    name:         'Bob Smith',
    email:        'bob@example.com',
    passwordHash: bobHash,
    createdAt:    new Date('2024-02-15')
  });

  const aliceId = aliceResult.insertedId;
  const bobId   = bobResult.insertedId;

  console.log('👤 Inserted 2 users');

  // ─── PROJECTS ────────────────────────────────────────────────────────────────
  const p1Result = await db.collection('projects').insertOne({
    ownerId:     aliceId,
    name:        'Website Redesign',
    description: 'Redesign the company website with a modern look and feel.',
    archived:    false,
    createdAt:   new Date('2024-03-01')
  });

  const p2Result = await db.collection('projects').insertOne({
    ownerId:     aliceId,
    name:        'Mobile App MVP',
    description: 'Build the first version of the iOS and Android app.',
    archived:    false,
    createdAt:   new Date('2024-03-15')
  });

  const p3Result = await db.collection('projects').insertOne({
    ownerId:     bobId,
    name:        'Data Pipeline',
    description: 'ETL pipeline to move data from legacy system to warehouse.',
    archived:    false,
    createdAt:   new Date('2024-04-01')
  });

  const p4Result = await db.collection('projects').insertOne({
    ownerId:     bobId,
    name:        'Q4 Marketing Campaign',
    description: 'Plan and execute the Q4 digital marketing campaign.',
    archived:    false,
    createdAt:   new Date('2024-04-10')
  });

  const p1Id = p1Result.insertedId;
  const p2Id = p2Result.insertedId;
  const p3Id = p3Result.insertedId;
  const p4Id = p4Result.insertedId;

  console.log('📁 Inserted 4 projects');

  // ─── TASKS ───────────────────────────────────────────────────────────────────
  // Alice's tasks — Website Redesign project
  await db.collection('tasks').insertOne({
    ownerId:   aliceId,
    projectId: p1Id,
    title:     'Create homepage mockup',
    status:    'done',
    priority:  3,
    tags:      ['design', 'ui'],
    subtasks:  [
      { title: 'Sketch wireframe',        done: true },
      { title: 'Build in Figma',          done: true },
      { title: 'Get feedback from team',  done: true }
    ],
    dueDate:   new Date('2024-04-01'),   // optional field — demonstrates schema flexibility
    createdAt: new Date('2024-03-02')
  });

  await db.collection('tasks').insertOne({
    ownerId:   aliceId,
    projectId: p1Id,
    title:     'Write API documentation',
    status:    'in-progress',
    priority:  2,
    tags:      ['docs', 'backend'],
    subtasks:  [
      { title: 'List all endpoints',  done: true  },
      { title: 'Add request samples', done: false },
      { title: 'Publish to Notion',   done: false }
    ],
    createdAt: new Date('2024-03-05')
    // no dueDate — shows schema flexibility
  });

  await db.collection('tasks').insertOne({
    ownerId:   aliceId,
    projectId: p1Id,
    title:     'Set up staging environment',
    status:    'todo',
    priority:  2,
    tags:      ['devops'],
    subtasks:  [],
    dueDate:   new Date('2024-05-15'),
    createdAt: new Date('2024-03-10')
  });

  await db.collection('tasks').insertOne({
    ownerId:   aliceId,
    projectId: p1Id,
    title:     'Write end-to-end tests',
    status:    'todo',
    priority:  1,
    tags:      ['testing', 'qa'],
    subtasks:  [
      { title: 'Install Playwright', done: false },
      { title: 'Write login test',   done: false }
    ],
    createdAt: new Date('2024-03-12')
  });

  await db.collection('tasks').insertOne({
    ownerId:   aliceId,
    projectId: p1Id,
    title:     'Performance audit',
    status:    'todo',
    priority:  1,
    tags:      ['performance'],
    subtasks:  [],
    createdAt: new Date('2024-03-14')
  });

  // Alice's tasks — Mobile App project
  await db.collection('tasks').insertOne({
    ownerId:   aliceId,
    projectId: p2Id,
    title:     'Set up React Native project',
    status:    'done',
    priority:  3,
    tags:      ['setup', 'mobile'],
    subtasks:  [
      { title: 'Install dependencies', done: true },
      { title: 'Configure ESLint',     done: true }
    ],
    createdAt: new Date('2024-03-16')
  });

  await db.collection('tasks').insertOne({
    ownerId:   aliceId,
    projectId: p2Id,
    title:     'Build login screen',
    status:    'in-progress',
    priority:  3,
    tags:      ['ui', 'auth', 'mobile'],
    subtasks:  [
      { title: 'Design layout',           done: true  },
      { title: 'Hook up auth API',         done: false },
      { title: 'Handle error states',      done: false }
    ],
    dueDate:   new Date('2024-05-01'),
    createdAt: new Date('2024-03-18')
  });

  await db.collection('tasks').insertOne({
    ownerId:   aliceId,
    projectId: p2Id,
    title:     'Implement push notifications',
    status:    'todo',
    priority:  2,
    tags:      ['mobile', 'backend'],
    subtasks:  [],
    createdAt: new Date('2024-03-20')
  });

  // Bob's tasks — Data Pipeline project
  await db.collection('tasks').insertOne({
    ownerId:   bobId,
    projectId: p3Id,
    title:     'Map legacy schema to new schema',
    status:    'done',
    priority:  3,
    tags:      ['data', 'planning'],
    subtasks:  [
      { title: 'Export old schema',  done: true },
      { title: 'Draft mapping doc',  done: true }
    ],
    createdAt: new Date('2024-04-02')
  });

  await db.collection('tasks').insertOne({
    ownerId:   bobId,
    projectId: p3Id,
    title:     'Build ETL job in Python',
    status:    'in-progress',
    priority:  3,
    tags:      ['data', 'python'],
    subtasks:  [
      { title: 'Extract step',    done: true  },
      { title: 'Transform step',  done: true  },
      { title: 'Load step',       done: false }
    ],
    dueDate:   new Date('2024-06-01'),
    createdAt: new Date('2024-04-05')
  });

  await db.collection('tasks').insertOne({
    ownerId:   bobId,
    projectId: p3Id,
    title:     'Schedule daily pipeline run',
    status:    'todo',
    priority:  2,
    tags:      ['devops', 'data'],
    subtasks:  [],
    createdAt: new Date('2024-04-08')
  });

  // Bob's tasks — Marketing project
  await db.collection('tasks').insertOne({
    ownerId:   bobId,
    projectId: p4Id,
    title:     'Draft campaign brief',
    status:    'done',
    priority:  3,
    tags:      ['marketing', 'writing'],
    subtasks:  [
      { title: 'Define target audience', done: true },
      { title: 'Set KPIs',               done: true }
    ],
    createdAt: new Date('2024-04-11')
  });

  await db.collection('tasks').insertOne({
    ownerId:   bobId,
    projectId: p4Id,
    title:     'Design social media assets',
    status:    'todo',
    priority:  2,
    tags:      ['marketing', 'design'],
    subtasks:  [
      { title: 'Instagram posts',  done: false },
      { title: 'Twitter banners',  done: false }
    ],
    dueDate:   new Date('2024-07-01'),
    createdAt: new Date('2024-04-12')
  });

  await db.collection('tasks').insertOne({
    ownerId:   bobId,
    projectId: p4Id,
    title:     'Write email newsletter',
    status:    'in-progress',
    priority:  2,
    tags:      ['marketing', 'writing'],
    subtasks:  [
      { title: 'Subject line options', done: true  },
      { title: 'Body copy',            done: false }
    ],
    createdAt: new Date('2024-04-13')
  });

  await db.collection('tasks').insertOne({
    ownerId:   bobId,
    projectId: p4Id,
    title:     'Set up Google Ads campaign',
    status:    'todo',
    priority:  1,
    tags:      ['marketing', 'ads'],
    subtasks:  [],
    createdAt: new Date('2024-04-14')
  });

  await db.collection('tasks').insertOne({
    ownerId:   bobId,
    projectId: p4Id,
    title:     'Analyse competitor keywords',
    status:    'todo',
    priority:  1,
    tags:      ['marketing', 'research'],
    subtasks:  [],
    createdAt: new Date('2024-04-15')
  });

  await db.collection('tasks').insertOne({
    ownerId:   bobId,
    projectId: p4Id,
    title:     'Prepare launch report',
    status:    'todo',
    priority:  2,
    tags:      ['marketing', 'reporting'],
    subtasks:  [
      { title: 'Collect metrics',  done: false },
      { title: 'Write summary',    done: false }
    ],
    dueDate:   new Date('2024-08-01'),
    createdAt: new Date('2024-04-16')
  });

  await db.collection('tasks').insertOne({
    ownerId:   aliceId,
    projectId: p2Id,
    title:     'App store submission',
    status:    'todo',
    priority:  1,
    tags:      ['mobile', 'release'],
    subtasks:  [
      { title: 'Prepare screenshots', done: false },
      { title: 'Write app description', done: false }
    ],
    createdAt: new Date('2024-03-22')
  });

  await db.collection('tasks').insertOne({
    ownerId:   aliceId,
    projectId: p1Id,
    title:     'SEO audit',
    status:    'todo',
    priority:  1,
    tags:      ['seo', 'marketing'],
    subtasks:  [],
    createdAt: new Date('2024-03-25')
  });

  await db.collection('tasks').insertOne({
    ownerId:   bobId,
    projectId: p3Id,
    title:     'Data quality checks',
    status:    'todo',
    priority:  2,
    tags:      ['data', 'qa'],
    subtasks:  [
      { title: 'Null value checks',  done: false },
      { title: 'Duplicate detection', done: false }
    ],
    createdAt: new Date('2024-04-09')
  });

  await db.collection('tasks').insertOne({
    ownerId:   aliceId,
    projectId: p2Id,
    title:     'Dark mode support',
    status:    'todo',
    priority:  1,
    tags:      ['ui', 'mobile'],
    subtasks:  [],
    createdAt: new Date('2024-03-28')
  });

  await db.collection('tasks').insertOne({
    ownerId:   aliceId,
    projectId: p1Id,
    title:     'Accessibility review',
    status:    'in-progress',
    priority:  2,
    tags:      ['a11y', 'qa'],
    subtasks:  [
      { title: 'Screen reader pass', done: true  },
      { title: 'Colour contrast check', done: false }
    ],
    createdAt: new Date('2024-03-30')
  });

  console.log('✅ Inserted 20 tasks');

  // ─── NOTES ───────────────────────────────────────────────────────────────────
  await db.collection('notes').insertOne({
    ownerId:   aliceId,
    content:   'Brand colours: primary #2563EB, secondary #7C3AED. Always use these, never use black text on dark backgrounds.',
    tags:      ['design', 'brand'],
    projectId: p1Id,           // linked to Website Redesign
    createdAt: new Date('2024-03-03')
  });

  await db.collection('notes').insertOne({
    ownerId:   aliceId,
    content:   'API uses REST not GraphQL. Base URL is https://api.example.com/v2. Auth via Bearer token in header.',
    tags:      ['docs', 'api', 'backend'],
    projectId: p1Id,
    createdAt: new Date('2024-03-06')
  });

  await db.collection('notes').insertOne({
    ownerId:   aliceId,
    content:   'React Native version must stay on 0.72 until Expo SDK 51 is released — do not upgrade.',
    tags:      ['mobile', 'setup'],
    projectId: p2Id,           // linked to Mobile App
    createdAt: new Date('2024-03-17')
  });

  await db.collection('notes').insertOne({
    ownerId:   aliceId,
    content:   'Meeting notes 2024-03-20: client wants dark mode by launch. Priority bumped up.',
    tags:      ['meeting', 'mobile'],
    // no projectId — standalone note, demonstrates schema flexibility
    createdAt: new Date('2024-03-20')
  });

  await db.collection('notes').insertOne({
    ownerId:   aliceId,
    content:   'Useful performance tools: Lighthouse, WebPageTest, Chrome DevTools coverage tab.',
    tags:      ['performance', 'tools'],
    // standalone note
    createdAt: new Date('2024-03-14')
  });

  await db.collection('notes').insertOne({
    ownerId:   bobId,
    content:   'Legacy DB is on Postgres 9.6. Connection string is in 1Password under "Legacy ETL".',
    tags:      ['data', 'backend'],
    projectId: p3Id,           // linked to Data Pipeline
    createdAt: new Date('2024-04-03')
  });

  await db.collection('notes').insertOne({
    ownerId:   bobId,
    content:   'Pipeline should run at 2am UTC daily. Use Apache Airflow, DAG name: legacy_etl_daily.',
    tags:      ['data', 'devops'],
    projectId: p3Id,
    createdAt: new Date('2024-04-06')
  });

  await db.collection('notes').insertOne({
    ownerId:   bobId,
    content:   'Q4 budget approved: $15,000 for ads, $5,000 for content production.',
    tags:      ['marketing', 'budget'],
    projectId: p4Id,           // linked to Marketing
    createdAt: new Date('2024-04-11')
  });

  await db.collection('notes').insertOne({
    ownerId:   bobId,
    content:   'Target audience: 25-40 year olds, urban professionals, interested in productivity tools.',
    tags:      ['marketing', 'research'],
    projectId: p4Id,
    createdAt: new Date('2024-04-12')
  });

  await db.collection('notes').insertOne({
    ownerId:   bobId,
    content:   'Personal reminder: review all project deadlines every Friday morning.',
    tags:      ['personal', 'planning'],
    // standalone note — no projectId
    createdAt: new Date('2024-04-10')
  });

  console.log('📝 Inserted 10 notes');
  console.log('');
  console.log('✅ Database seeded successfully!');
  console.log('   Alice login: alice@example.com / password123');
  console.log('   Bob login:   bob@example.com   / password456');

  process.exit(0);
})();