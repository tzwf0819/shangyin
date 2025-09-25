const axios = require('axios');

(async ()=>{
  const base = 'http://localhost:3000/shangyin';
  try {
    console.log('--- 生产记录API冒烟测试 ---');

    // 1. 确保有员工
    let empId;
    try {
      const er = await axios.post(base + '/employees', { name: '测试员工A', code: 'EMP-A' });
      empId = er.data.data.employee.id;
    } catch {
      const el = await axios.get(base + '/employees');
      empId = el.data.data.employees[0]?.id;
      if(!empId) throw new Error('无员工且创建失败');
    }
    console.log('员工ID:', empId);

    // 2. 确保有工序（perItem / perHour 各一个）
    const p1 = await axios.post(base + '/processes', { name: '计件工序X', payRate: 2.5, payRateUnit:'perItem' }).catch(()=>null);
    const p2 = await axios.post(base + '/processes', { name: '计时工序Y', payRate: 60, payRateUnit:'perHour' }).catch(()=>null);
    const plist = (await axios.get(base + '/processes')).data.data.processes;
    const piece = plist.find(p=>p.payRateUnit==='perItem');
    const hour = plist.find(p=>p.payRateUnit==='perHour');
    console.log('工序(计件,计时):', piece?.id, hour?.id);

    // 3. 确保有合同与合同产品
    // 3. 直接创建含一个产品的合同
    const c = await axios.post(base + '/contracts', { 
      contractNumber: 'CT-' + Date.now(),
      products: [{ productName:'产品A', quantity:'1' }]
    });
    const contractId = c.data.data.contract.id;
    const cd = await axios.get(base + '/contracts/' + contractId);
    const cpId = cd.data.data.contract.products?.[0]?.id;
    if(!cpId) throw new Error('合同未包含产品，无法继续');
    console.log('合同/合同产品:', contractId, cpId);

    // 4. 新建生产记录（计件）
    const r1 = await axios.post(base + '/production/record', {
      employeeId: empId,
      contractId: contractId,
      contractProductId: cpId,
      processId: piece.id,
      quantity: 4,
      actualTimeMinutes: 0,
      notes: '计件测试'
    });
    console.log('计件返回金额:', r1.data.data.record.payAmount);

    // 5. 新建生产记录（计时）
    const r2 = await axios.post(base + '/production/record', {
      employeeId: empId,
      contractId: contractId,
      contractProductId: cpId,
      processId: hour.id,
      quantity: 1,
      actualTimeMinutes: 90,
      notes: '计时测试'
    });
    console.log('计时返回金额:', r2.data.data.record.payAmount);

    // 6. 查询列表
    const q = await axios.get(base + '/production/record', { params: { contractId: contractId, limit: 5 } });
    console.log('查询记录数:', q.data.data.records.length);

    // 7. 编辑第一条，修改时间
    const first = q.data.data.records[0];
    const u = await axios.put(base + '/production/record/' + first.id, {
      employeeId: first.employeeId,
      contractId: first.contractId,
      contractProductId: first.contractProductId,
      processId: first.processId,
      quantity: first.quantity,
      actualTimeMinutes: 120,
      notes: '编辑测试'
    });
    console.log('编辑后金额:', u.data.data.record.payAmount);

    console.log('✅ 生产记录API冒烟测试完成');
  } catch (e) {
    console.error('❌ 生产记录测试失败:', e.response?.data || e.message);
    process.exit(1);
  }
})();
