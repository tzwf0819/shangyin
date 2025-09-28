<template>
  <div>
    <div class="toolbar">
      <input v-model="query.keyword" placeholder="合同编号/甲方/乙方" @keyup.enter="load" />
      <button class="primary" @click="openEdit()">新增合同</button>
      <button @click="openImport">批量导入</button>
    </div>

    <div class="table-wrapper" v-if="items.length">
      <table>
        <thead>
          <tr>
            <th>合同编号</th>
            <th>甲方</th>
            <th>乙方</th>
            <th>签订时间</th>
            <th>新木箱</th>
            <th>新图纸</th>
            <th>图纸审核</th>
            <th>产品数</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in items" :key="c.id">
            <td>{{ c.contractNumber }}</td>
            <td>{{ c.partyAName || '-' }}</td>
            <td>{{ c.partyBName || '-' }}</td>
            <td>{{ c.signedDate || '-' }}</td>
            <td><input type="checkbox" disabled :checked="c.isNewWoodBox" /></td>
            <td><input type="checkbox" disabled :checked="c.isNewDrawing" /></td>
            <td><input type="checkbox" disabled :checked="c.isDrawingReviewed" /></td>
            <td>{{ (c.products || []).length }}</td>
            <td>
              <button @click="openEdit(c)">编辑</button>
              <button class="danger" @click="remove(c.id)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else class="empty">暂无合同</div>

    <dialog ref="dlgEdit" class="dialog-large">
      <form @submit.prevent="saveEdit">
        <div class="modal-header">{{ form.id ? '编辑合同' : '新增合同' }}</div>
        <div class="modal-body">
          <section>
            <h3>基本信息</h3>
            <div class="grid">
              <label>合同编号<input v-model="form.contractNumber" required /></label>
              <label>甲方<input v-model="form.partyAName" /></label>
              <label>乙方<input v-model="form.partyBName" /></label>
              <label>签订时间<input v-model="form.signedDate" placeholder="例如 2025-09-30" /></label>
              <label>签订地点<input v-model="form.signedLocation" /></label>
            </div>
            <div class="checkbox-row">
              <label><input type="checkbox" v-model="form.isNewWoodBox" /> 是否新木箱</label>
              <label><input type="checkbox" v-model="form.isNewDrawing" /> 是否新图纸</label>
              <label><input type="checkbox" v-model="form.isDrawingReviewed" /> 图纸已审核</label>
            </div>
          </section>

          <section>
            <h3>条款</h3>
            <div class="grid clauses">
              <label v-for="field in clauseFields" :key="field">
                {{ clauseLabels[field] }}
                <textarea v-model="form[field]" rows="2"></textarea>
              </label>
            </div>
          </section>

          <section class="grid">
            <h3 class="full">甲方信息</h3>
            <label>甲单位名称<input v-model="form.partyACompanyName" /></label>
            <label>甲单位地址<input v-model="form.partyAAddress" /></label>
            <label>甲联系人<input v-model="form.partyAContact" /></label>
            <label>甲电话传真<input v-model="form.partyAPhoneFax" /></label>
            <label>甲开户银行<input v-model="form.partyABank" /></label>
            <label>甲行号<input v-model="form.partyABankNo" /></label>
            <label>甲账号<input v-model="form.partyABankAccount" /></label>
            <label>甲税号<input v-model="form.partyATaxNumber" /></label>
          </section>

          <section class="grid">
            <h3 class="full">乙方信息</h3>
            <label>乙单位名称<input v-model="form.partyBCompanyName" /></label>
            <label>乙单位地址<input v-model="form.partyBAddress" /></label>
            <label>乙联系人<input v-model="form.partyBContact" /></label>
            <label>乙电话传真<input v-model="form.partyBPhoneFax" /></label>
            <label>乙开户银行<input v-model="form.partyBBank" /></label>
            <label>乙行号<input v-model="form.partyBBankNo" /></label>
            <label>乙账号<input v-model="form.partyBBankAccount" /></label>
            <label>乙税号<input v-model="form.partyBTaxNumber" /></label>
          </section>

          <section>
            <h3>备注</h3>
            <textarea v-model="form.remark" rows="3"></textarea>
          </section>

          <section>
            <h3>合同产品</h3>
            <div v-for="(product, index) in form.products" :key="index" class="product-card">
              <header>
                <span>产品 {{ index + 1 }}</span>
                <button type="button" class="danger" @click="removeProduct(index)">移除</button>
              </header>
              <div class="grid">
                <label>产品类型<input v-model="product.productType" /></label>
                <label>产品编号<input v-model="product.productCode" /></label>
                <label>产品名称<input v-model="product.productName" required /></label>
                <label>规格<input v-model="product.specification" /></label>
                <label>雕宽<input v-model="product.carveWidth" /></label>
                <label>网型<input v-model="product.meshType" /></label>
                <label>线数<input v-model="product.lineCount" /></label>
                <label>容积率<input v-model="product.volumeRatio" /></label>
                <label>数量<input v-model="product.quantity" /></label>
                <label>单价<input v-model="product.unitPrice" /></label>
                <label>交货期限<input v-model="product.deliveryDeadline" /></label>
                <label>总金额<input v-model="product.totalAmount" /></label>
              </div>
            </div>
            <button type="button" @click="addProduct">+ 添加产品</button>
          </section>
        </div>
        <div class="modal-footer">
          <button type="button" @click="closeEdit">取消</button>
          <button class="primary" type="submit">保存</button>
        </div>
      </form>
    </dialog>

    <dialog ref="dlgImport">
      <form @submit.prevent="doImport">
        <div class="modal-header">批量导入合同(JSON)</div>
        <div class="modal-body">
          <textarea v-model="importText" rows="12"></textarea>
          <small class="muted">示例：{"contracts":[{"合同编号":"HT-001","甲方":"甲方公司","乙方":"乙方公司","是否新木箱":true,"条款一":"...","products":[{"产品名称":"产品A","产品类型":"类型A","数量":"10"}]}]}</small>
        </div>
        <div class="modal-footer">
          <button type="button" @click="dlgImport.value.close()">取消</button>
          <button class="primary" type="submit">导入</button>
        </div>
      </form>
    </dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { listContracts, createContract, updateContract, deleteContract, importContracts } from '../api/contracts';

const clauseFields = Array.from({ length: 10 }, (_, i) => `clause${i + 1}`);
const clauseLabels = clauseFields.reduce((acc, field, index) => {
  acc[field] = `条款${index + 1}`;
  return acc;
}, {});

const contractImportMap = {
  '合同编号': 'contractNumber',
  '甲方': 'partyAName',
  '乙方': 'partyBName',
  '签订时间': 'signedDate',
  '签订地点': 'signedLocation',
  '是否新木箱': 'isNewWoodBox',
  '甲单位名称': 'partyACompanyName',
  '甲单位地址': 'partyAAddress',
  '甲联系人': 'partyAContact',
  '甲电话传真': 'partyAPhoneFax',
  '甲开户银行': 'partyABank',
  '甲行号': 'partyABankNo',
  '甲账号': 'partyABankAccount',
  '甲税号': 'partyATaxNumber',
  '乙单位名称': 'partyBCompanyName',
  '乙单位地址': 'partyBAddress',
  '乙联系人': 'partyBContact',
  '乙电话传真': 'partyBPhoneFax',
  '乙开户银行': 'partyBBank',
  '乙行号': 'partyBBankNo',
  '乙账号': 'partyBBankAccount',
  '乙税号': 'partyBTaxNumber',
  '是否新图纸': 'isNewDrawing',
  '是否图纸审核': 'isDrawingReviewed',
  '备注': 'remark',
};
clauseFields.forEach((field, index) => {
  contractImportMap[`条款${index + 1}`] = field;
});

const productImportMap = {
  '产品类型': 'productType',
  '产品编号': 'productCode',
  '产品名称': 'productName',
  '规格': 'specification',
  '雕宽': 'carveWidth',
  '网型': 'meshType',
  '线数': 'lineCount',
  '容积率': 'volumeRatio',
  '数量': 'quantity',
  '单价': 'unitPrice',
  '交货期限': 'deliveryDeadline',
  '总金额': 'totalAmount',
};

const mapImportedContract = (raw) => {
  if (!raw || typeof raw !== 'object') return {};
  const mapped = {};
  Object.keys(raw).forEach((key) => {
    const target = contractImportMap[key] || key;
    mapped[target] = raw[key];
  });
  const products = Array.isArray(raw.products) ? raw.products : [];
  mapped.products = products.map((product) => {
    const target = {};
    Object.keys(product || {}).forEach((key) => {
      const mappedKey = productImportMap[key] || key;
      target[mappedKey] = product[key];
    });
    return target;
  });
  return mapped;
};

const defaultContract = () => ({
  id: null,
  contractNumber: '',
  partyAName: '',
  partyBName: '',
  signedDate: '',
  signedLocation: '',
  isNewWoodBox: false,
  isNewDrawing: false,
  isDrawingReviewed: false,
  partyACompanyName: '',
  partyAAddress: '',
  partyAContact: '',
  partyAPhoneFax: '',
  partyABank: '',
  partyABankNo: '',
  partyABankAccount: '',
  partyATaxNumber: '',
  partyBCompanyName: '',
  partyBAddress: '',
  partyBContact: '',
  partyBPhoneFax: '',
  partyBBank: '',
  partyBBankNo: '',
  partyBBankAccount: '',
  partyBTaxNumber: '',
  remark: '',
  products: [],
  ...clauseFields.reduce((acc, field) => ({ ...acc, [field]: '' }), {}),
});

const defaultProduct = () => ({
  productType: '',
  productCode: '',
  productName: '',
  specification: '',
  carveWidth: '',
  meshType: '',
  lineCount: '',
  volumeRatio: '',
  quantity: '',
  unitPrice: '',
  deliveryDeadline: '',
  totalAmount: '',
});

const query = reactive({ page: 1, limit: 20, keyword: '' });
const items = ref([]);
const form = reactive(defaultContract());
const dlgEdit = ref();
const dlgImport = ref();
const importText = ref('{\n  "contracts": [\n    {\n      "合同编号": "HT-001",\n      "甲方": "甲方公司",\n      "乙方": "乙方公司",\n      "是否新木箱": true,\n      "条款一": "双方共同遵守...",\n      "products": [\n        { "产品名称": "产品A", "产品类型": "类型A", "数量": "10" }\n      ]\n    }\n  ]\n}');

const load = async () => {
  const response = await listContracts(query);
  if (response.success) {
    items.value = response.data.items || [];
  }
};

const openEdit = (contract = null) => {
  Object.assign(form, defaultContract());
  if (contract) {
    Object.assign(form, JSON.parse(JSON.stringify(contract)));
    form.isNewWoodBox = Boolean(form.isNewWoodBox);
    form.isNewDrawing = Boolean(form.isNewDrawing);
    form.isDrawingReviewed = Boolean(form.isDrawingReviewed);
    clauseFields.forEach((field) => {
      if (!Object.prototype.hasOwnProperty.call(form, field) || form[field] === null) {
        form[field] = '';
      }
    });
    form.products = (form.products || []).map((product) => ({ ...defaultProduct(), ...product }));
  }
  if (!form.products.length) {
    form.products.push(defaultProduct());
  }
  dlgEdit.value.showModal();
};

const closeEdit = () => {
  try {
    dlgEdit.value.close();
  } catch (error) {
    console.warn('close dialog failed', error);
  }
};

const addProduct = () => {
  form.products.push(defaultProduct());
};

const removeProduct = (index) => {
  form.products.splice(index, 1);
  if (!form.products.length) {
    form.products.push(defaultProduct());
  }
};

const normalisePayload = () => {
  const payload = { ...form };
  payload.products = (form.products || []).map((product) => ({ ...product }));
  return payload;
};

const saveEdit = async () => {
  try {
    const payload = normalisePayload();
    if (form.id) {
      await updateContract(form.id, payload);
    } else {
      await createContract(payload);
    }
    closeEdit();
    await load();
  } catch (error) {
    const message = error?.response?.data?.message || '保存失败';
    alert(message);
  }
};

const remove = async (id) => {
  if (!confirm('确认删除该合同？删除后将无法恢复。')) return;
  try {
    await deleteContract(id);
    await load();
  } catch (error) {
    const message = error?.response?.data?.message || '删除失败';
    alert(message);
  }
};

const openImport = () => {
  dlgImport.value.showModal();
};

const doImport = async () => {
  try {
    const json = JSON.parse(importText.value || '{}');
    const contracts = json.contracts || [];
    if (!Array.isArray(contracts) || !contracts.length) {
      throw new Error('格式错误：contracts 为空');
    }
    const normalizedContracts = contracts.map(mapImportedContract);
    const response = await importContracts(normalizedContracts);
    const { successCount = 0, failureCount = 0 } = response.data || {};
    alert(`导入完成：成功 ${successCount} 条，失败 ${failureCount} 条`);
    dlgImport.value.close();
    await load();
  } catch (error) {
    alert(error?.message || '导入失败，请检查 JSON 格式');
  }
};

onMounted(load);
</script>

<style scoped>
.toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.table-wrapper {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow-x: auto;
}
table {
  width: 100%;
  border-collapse: collapse;
}
th,
td {
  padding: 8px 12px;
  border-bottom: 1px solid #f1f5f9;
  font-size: 13px;
  text-align: left;
}
.dialog-large {
  width: min(960px, 95%);
}
.modal-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 70vh;
  overflow-y: auto;
}
.grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}
.grid textarea,
.grid input {
  width: 100%;
}
.checkbox-row {
  display: flex;
  gap: 16px;
}
.checkbox-row label {
  display: flex;
  align-items: center;
  gap: 6px;
}
.product-card {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
  background: #f8fafc;
}
.product-card header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-weight: 600;
}
section h3 {
  font-size: 15px;
  margin-bottom: 8px;
}
section h3.full {
  grid-column: 1 / -1;
}
textarea {
  width: 100%;
  font-family: inherit;
}
.muted {
  color: #64748b;
}
.primary {
  background: #2563eb;
  color: #fff;
  border: none;
  padding: 6px 14px;
  border-radius: 6px;
  cursor: pointer;
}
.danger {
  background: #dc2626;
  color: #fff;
  border: none;
  padding: 4px 10px;
  border-radius: 4px;
  cursor: pointer;
}
.empty {
  color: #64748b;
  font-size: 13px;
}
</style>
