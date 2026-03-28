/**
 * Request Queue System (Bull + Redis)
 * 
 * For high volume, don't broadcast immediately.
 * Queue the work and process asynchronously.
 * Includes automatic retries and failure handling.
 */

let Queue;
let queue;
let enabled = false;

function initQueue(redisUrl) {
  try {
    Queue = require('bull');
    
    queue = new Queue('medsta-broadcast', redisUrl || {
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT || 6379)
    });

    queue.on('completed', (job) => {
      console.log(`✅ Broadcast job ${job.id} completed`);
    });

    queue.on('failed', (job, error) => {
      console.error(`❌ Broadcast job ${job.id} failed:`, error.message);
    });

    enabled = true;
    console.log('📦 Request queue initialized with Redis');
    return true;
  } catch (error) {
    console.warn('⚠️  Could not initialize queue (Redis not available):', error.message);
    enabled = false;
    return false;
  }
}

/**
 * Add broadcast request to queue
 * Automatically retries 3 times with exponential backoff
 */
async function addBroadcastJob(requestId, userPhone, type, details) {
  if (!enabled || !queue) {
    console.warn('Queue not enabled, skipping job');
    return null;
  }

  try {
    const job = await queue.add(
      {
        requestId,
        userPhone,
        type,
        details,
        timestamp: new Date().toISOString()
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000  // Start with 2 seconds
        },
        removeOnComplete: true,
        removeOnFail: false  // Keep failed jobs for analysis
      }
    );

    console.log(`📮 Job queued: ${job.id} (request: ${requestId})`);
    return job;
  } catch (error) {
    console.error('Failed to queue job:', error.message);
    return null;
  }
}

/**
 * Process broadcast jobs
 * Called from server.js during initialization
 */
function startQueueWorker(broadcastFunction) {
  if (!enabled || !queue) {
    return;
  }

  queue.process(1, async (job) => {
    const { requestId, userPhone, type, details } = job.data;

    console.log(`🔄 Processing job ${job.id}: broadcast request ${requestId}`);

    try {
      // Call the actual broadcast function
      await broadcastFunction(requestId, userPhone, type, details);
      return { success: true, requestId };
    } catch (error) {
      console.error(`Job ${job.id} error:`, error.message);
      throw error;  // Bull will handle retry
    }
  });
}

/**
 * Get queue statistics
 */
async function getQueueStats() {
  if (!enabled || !queue) {
    return null;
  }

  const counts = await queue.getJobCounts();
  return {
    active: counts.active,
    waiting: counts.waiting,
    completed: counts.completed,
    failed: counts.failed,
    delayed: counts.delayed
  };
}

/**
 * Drain the queue (for shutdown)
 */
async function drainQueue() {
  if (queue) {
    await queue.drain();
    await queue.close();
    console.log('Queue drained and closed');
  }
}

module.exports = {
  initQueue,
  addBroadcastJob,
  startQueueWorker,
  getQueueStats,
  drainQueue,
  isEnabled: () => enabled
};
