const axios = require('axios');

(async () => {
  const base = 'http://localhost:3000/shangyin';
  try {
    console.log('--- 产品类型工序顺序重排测试 ---');

    // 准备：获取至少 3 个工序，不足则创建
    let procResp = await axios.get(`${base}/processes`);
    let processes = procResp.data.data.processes;
    let need = 3 - processes.length;
    for (let i=0;i<need;i++) {
      await axios.post(`${base}/processes`, { name:`重排测试工序-${Date.now()}-${i}`, payRate:1, payRateUnit:'perItem' });
    }
    if (need>0) {
      procResp = await axios.get(`${base}/processes`);
      processes = procResp.data.data.processes;
    }
    processes = processes.slice(0,3); // 取前三
    console.log('使用工序ID顺序:', processes.map(p=>p.id).join(','));

    // 1. 创建产品类型（正序）
    const createResp = await axios.post(`${base}/product-types`, {
      name: '顺序测试类型-' + Date.now(),
      processes: processes.map((p,i)=>({ id:p.id, sequenceOrder: i+1 }))
    });
    const pt = createResp.data.data.productType;
    const ptId = pt.id;
    console.log('创建产品类型ID:', ptId);
    console.log('初始返回顺序:', pt.processes.map(p=>p.id).join(','));

    // 2. 倒序修改 (使用 processes 只有 id 无 sequenceOrder 来测试兼容)
    const reversed = [...processes].reverse();
    const updateResp = await axios.put(`${base}/product-types/${ptId}`, {
      name: pt.name,
      processes: reversed.map(p=>({ id: p.id }))
    });
    console.log('更新(倒序)返回顺序:', updateResp.data.data.productType.processes.map(p=>p.id).join(','));

    // 3. 再次获取确认
    const getResp = await axios.get(`${base}/product-types/${ptId}`);
    const finalOrder = getResp.data.data.productType.processes.map(p=>p.id).join(',');
    console.log('再次获取顺序:', finalOrder);

    const expected = reversed.map(p=>p.id).join(',');
    if (finalOrder === expected) {
      console.log('✅ 顺序更新验证成功, 期望/实际:', expected);
    } else {
      console.error('❌ 顺序更新失败: 期望', expected, '实际', finalOrder);
      process.exitCode = 1;
    }

    // 4. 再次使用 processIds 方式调换回原顺序
    const updateResp2 = await axios.put(`${base}/product-types/${ptId}`, {
      name: pt.name,
      processIds: processes.map(p=>p.id)
    });
    const order2 = updateResp2.data.data.productType.processes.map(p=>p.id).join(',');
    console.log('使用 processIds 恢复顺序返回:', order2);
    const getResp2 = await axios.get(`${base}/product-types/${ptId}`);
    const finalOrder2 = getResp2.data.data.productType.processes.map(p=>p.id).join(',');
    console.log('再次获取顺序2:', finalOrder2);
    const expected2 = processes.map(p=>p.id).join(',');
    if (finalOrder2 === expected2) {
      console.log('✅ processIds 顺序更新验证成功');
    } else {
      console.error('❌ processIds 顺序更新失败: 期望', expected2, '实际', finalOrder2);
      process.exitCode = 1;
    }

  } catch (e) {
    console.error('测试过程中出现错误:');
    if (e.response) {
      console.error('状态码:', e.response.status);
      console.error('响应数据:', JSON.stringify(e.response.data));
    } else {
      console.error(e);
    }
    process.exitCode = 1;
  }
})();
