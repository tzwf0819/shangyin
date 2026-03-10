<template>
  <div class="permissions-page">
    <div class="page-header">
      <h2>权限管理</h2>
      <button class="primary" @click="openCreate">新增权限</button>
    </div>

    <!-- 权限列表 -->
    <div class="table-wrapper" v-if="permissions.length">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>权限名称</th>
            <th>权限编码</th>
            <th>模块</th>
            <th>描述</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in permissions" :key="item.id">
            <td>{{ item.id }}</td>
            <td>{{ item.name }}</td>
            <td><code>{{ item.code }}</code></td>
            <td>{{ item.module }}</td>
            <td>{{ item.description || '-' }}</td>
            <td>
              <button @click="edit(item)">编辑</button>
              <button class="danger" @click="remove(item.id)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="empty" v-else>暂无权限</div>

    <!-- 新增/编辑对话框 -->
    <dialog ref="dlg">
      <form @submit.prevent="save">
        <div class="modal-header">{{ form.id ? '编辑权限' : '新增权限' }}</div>
        <div class="modal-body">
          <div class="field">
            <label>权限名称 *</label>
            <input v-model="form.name" required placeholder="例如：查看所有合同" />
          </div>
          <div class="field">
            <label>权限编码 *</label>
            <input v-model="form.code" required placeholder="例如：contracts:view:all" />
          </div>
          <div class="field">
            <label>所属模块</label>
            <select v-model="form.module">
              <option value="default">默认</option>
              <option value="contracts">合同管理</option>
              <option value="production">生产管理</option>
              <option value="employees">员工管理</option>
              <option value="processes">工序管理</option>
              <option value="performance">绩效管理</option>
            </select>
          </div>
          <div class="field">
            <label>描述</label>
            <textarea v-model="form.description" rows="3" placeholder="权限描述"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" @click="close">取消</button>
          <button class="primary" type="submit">保存</button>
        </div>
      </form>
    </dialog>
  </div>
</template>

<script>
import { api } from '../api/http';

export default {
  name: 'Permissions',
  data() {
    return {
      permissions: [],
      form: {
        id: null,
        name: '',
        code: '',
        description: '',
        module: 'default'
      },
      dlg: null
    };
  },
  mounted() {
    this.load();
    this.dlg = this.$refs.dlg;
  },
  methods: {
    async load() {
      try {
        const res = await api.get('/shangyin/permissions');
        if (res.success) {
          this.permissions = res.data || [];
        }
      } catch (error) {
        console.error('加载权限失败', error);
        alert('加载权限失败');
      }
    },
    openCreate() {
      this.form = { id: null, name: '', code: '', description: '', module: 'default' };
      this.dlg.showModal();
    },
    edit(item) {
      this.form = { ...item };
      this.dlg.showModal();
    },
    async save() {
      try {
        let res;
        if (this.form.id) {
          res = await api.put(`/shangyin/permissions/${this.form.id}`, this.form);
        } else {
          res = await api.post('/shangyin/permissions', this.form);
        }
        if (res.success) {
          alert('保存成功');
          this.dlg.close();
          this.load();
        }
      } catch (error) {
        console.error('保存失败', error);
        alert(error.response?.data?.message || '保存失败');
      }
    },
    close() {
      this.dlg.close();
    },
    async remove(id) {
      if (!confirm('确定删除此权限？')) return;
      try {
        const res = await api.delete(`/shangyin/permissions/${id}`);
        if (res.success) {
          alert('删除成功');
          this.load();
        }
      } catch (error) {
        console.error('删除失败', error);
        alert('删除失败');
      }
    }
  }
};
</script>

<style scoped>
.permissions-page {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.table-wrapper {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background: #f5f5f5;
}

th, td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

code {
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}

.empty {
  text-align: center;
  padding: 60px 0;
  color: #999;
}

dialog {
  border: none;
  border-radius: 8px;
  padding: 0;
  max-width: 500px;
  width: 90%;
}

dialog::backdrop {
  background: rgba(0, 0, 0, 0.5);
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #eee;
  font-size: 18px;
  font-weight: bold;
}

.modal-body {
  padding: 20px;
}

.field {
  margin-bottom: 16px;
}

.field label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
}

.field input,
.field select,
.field textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.modal-footer {
  padding: 20px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button.primary {
  background: #3BA372;
  color: #fff;
}

button.danger {
  background: #dc2626;
  color: #fff;
}
</style>
