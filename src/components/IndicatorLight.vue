<script setup lang="ts">
const props = defineProps({
  code: Number // 0 未连接, 1 连接中, 2 连接成功, 3 连接失败
})
</script>

<template>
  <div @click="$emit('connect-server')" class="indicatorLight">
    <div v-if="code == 0" class="status-point" style=" background-color:#bfbfbf"/>
    <div v-if="code == 1" class="status-point" style=" background-color:#e6a23c"/>
    <div v-if="code == 2" class="status-point" style=" background-color:#67C23A"/>
    <div v-if="code == 3" class="status-point" style=" background-color:red"/>&nbsp;<span>服务器</span>
  </div>
</template>

<style scoped>
.status-point {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  vertical-align: baseline;
  cursor: pointer;
}

span {
  vertical-align: middle;
}

.indicatorLight {
  cursor: pointer;
  display: inline-block;
  user-select: none;
}
</style>