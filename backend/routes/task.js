// routes/task.js
const express = require('express');
const router = express.Router();

// TODO: 实现任务相关的控制器
// const { getTasks, createTask, completeTask } = require('../controllers/taskController');

// 测试根路径
router.get('/', (req, res) => {
  res.json({ success: true, data: [], message: '任务接口待实现' });
});

// 获取用户任务
router.get('/user/:userId', (req, res) => {
  const { userId } = req.params;
  // 模拟返回任务数据
  res.json({ 
    success: true, 
    data: {
      tasks: [
        {
          id: 1,
          contractNo: 'CT001',
          productName: '版辊A',
          processName: '粗加工',
          status: 'pending'
        },
        {
          id: 2,
          contractNo: 'CT002',
          productName: '版辊B',
          processName: '精加工',
          status: 'pending'
        }
      ]
    }
  });
});

// 完成任务
router.post('/:taskId/complete', (req, res) => {
  const { taskId } = req.params;
  res.json({ 
    success: true, 
    message: `任务 ${taskId} 完成接口待实现` 
  });
});

module.exports = router;