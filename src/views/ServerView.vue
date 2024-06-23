<script setup lang="ts">
import {getCurrentInstance, ref, watch} from 'vue'
import {Peer} from "peerjs";
import {notification} from 'ant-design-vue';
import IndicatorLight from "@/components/IndicatorLight.vue";
import axios, {type ResponseType} from 'axios';

const app = getCurrentInstance();
const serverId = app?.appContext.config.globalProperties.serverId
console.log("serverId", serverId);

const connectStatus = ref(0);

let peer: Peer | null = null;
let connObjList: any[] = [];

function startUp() {
  if (connectStatus.value == 1 || connectStatus.value == 2) {
    return;
  }
  connectStatus.value = 1;
  notification['info']({message: '正在自启动中', description: '向信令服务器申请自身ID中...', duration: 10});
  let peer = new Peer(serverId);
  peer.on('open', function (id) {
    connectStatus.value = 2;
    console.log('peer open', id);
    notification['info']({message: '自启动成功', description: '注册自身成功,ID为' + id, duration: 10});
  });
  peer.on('connection', (connObj) => {
    console.log('connection ', connObj);
    connObjList.push(connObj);
    connObj.on('data', (data: any) => {
      if (data.type == "heartBeat") {
        return;
      }
      if (data.type == "send") {
        console.log('data', data);
        let file = new File([data.file.buffer], data.name, {type: data.fileType});
        console.log(file);

        console.log('发起pdf转换请求');
        let param = new FormData();
        param.append("uploadFile", file);
        let bb: ResponseType = 'blob';
        let config = {headers: {"Content-Type": "multipart/form-data"}, responseType: bb}
        axios.post("http://localhost:8080/pdf/upload", param, config).then((res) => {
          console.log("res", res);
          console.log('res.headers', res.headers);
          let fileName = res.headers['content-disposition'].split(';')[1].split('=')[1].replace(/\"/g, '');
          console.log("文件名称:", decodeURIComponent(fileName));

          connObj.send({
            type: "xlsFile",
            file: res.data,
            filename: decodeURIComponent(fileName),
            contentType: res.headers['content-type']
          })
        });
        return;
      }
    })
  });
  peer.on('error', function (err) {
    connectStatus.value = 3;
    console.log('peer error', err);
    notification['error']({message: '出现错误', description: JSON.stringify(err), duration: null});
  });
}

// TODO 服务器的开关是失灵的，关闭之后仍然存在着连接
function close() {
  console.log('close peer');
  for (let i = 0; i < connObjList.length; i++) {
    connObjList[i].close();
  }
  connObjList = [];
  if (peer != null) {
    // peer.disconnect();
    peer.destroy();
    peer = null;
  }
}

if (localStorage.startOnLoad == undefined) {
  localStorage.startOnLoad = true;
}
console.log('localStorage.startOnLoad', localStorage.startOnLoad);
const state = ref(JSON.parse(localStorage.startOnLoad));
if (state.value) {
  startUp();
}
watch(state, (newValue) => {
  localStorage.startOnLoad = newValue;
  if (newValue) {
    startUp();
  } else {
    close();
  }
})
</script>

<template>
  <div class="server-view">
    <div style="margin-bottom: 20px;">
      <IndicatorLight :code="connectStatus"></IndicatorLight>
    </div>
    <div>
      <a-switch v-model:checked="state" checked-children="开" un-checked-children="关"/>
    </div>
  </div>
</template>

<style scoped>
.server-view {
  padding: 20px;
}
</style>