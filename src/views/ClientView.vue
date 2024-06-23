<script setup lang="ts">
import {getCurrentInstance, ref} from 'vue';
import {message} from 'ant-design-vue';
import {UploadOutlined} from '@ant-design/icons-vue';
import type {UploadChangeParam} from 'ant-design-vue';
import {DataConnection, Peer} from "peerjs";
import IndicatorLight from "@/components/IndicatorLight.vue";
import {notification} from 'ant-design-vue';

// ========================webrtc部分=============================
const app = getCurrentInstance();
const serverId = app?.appContext.config.globalProperties.serverId
console.log("serverId", serverId);

const connectStatus = ref(0);
let peerStatus = 0; // 0 未连接， 1 连接中， 2 连接成功， 3 连接失败
let connectServerStatus = 0; // 0 未连接， 1 连接中， 2 连接成功， 3 连接失败
let peer: Peer;

function selfOpen() {
  if (peerStatus == 1 || peerStatus == 2) {
    if (connectServerStatus == 0 || connectServerStatus == 3) {
      connectServer();
    }
    return;
  }
  peerStatus = 1;
  connectStatus.value = 1;
  peer = new Peer();
  peer.on('open', function (id) {
    console.log('peer open', id);
    peerStatus = 2;
    connectServer();
  });
  peer.on('error', function (err) {
    console.log('peer error', err);
    connectStatus.value = 3;
    if (err.type == 'disconnected') {
      peerStatus = 3;
      return
    }
    if (err.type == "peer-unavailable") {
      connectServerStatus = 3;
      notification['error']({
        message: '连接pdf服务器失败，请稍后重试',
        description: JSON.stringify(err)
      });
      return
    }
    peerStatus = 3;
  });
}

function connectServer() {
  if (peerStatus != 2 || connectServerStatus == 1 || connectServerStatus == 2) {
    return;
  }
  connectStatus.value = 1;
  connectServerStatus = 1;
  let connObj: DataConnection = peer.connect(serverId);
  console.log('peer 连接 ' + serverId);
  let interval: number;
  connObj.on('open', () => {
    console.log('connObj open');
    connectServerStatus = 2;
    connectStatus.value = 2;
    notification['info']({message: '连接服务器成功'});
    interval = setInterval(() => {
      connObj.send({"type": "heartBeat"});
    }, 1000);
  })
  connObj.on('data', (res: any) => {
    console.log('connObj data', res);
    if (res.type == 'xlsFile') {
      // 处理 Blob 数据
      let fileName = res.filename;
      console.log("文件名称:", fileName);
      let type = res.contentType;
      console.log('type', type);
      let data = res.file;
      let blob = new Blob([data], {type: type})
      //对于<a>标签，只有 Firefox 和 Chrome（内核） 支持 download 属性
      //IE10以上支持blob但是依然不支持download
      if ('download' in document.createElement('a')) { //支持a标签download的浏览器
        const link = document.createElement('a')//创建a标签
        link.download = fileName //a标签添加属性
        link.style.display = 'none'
        link.href = URL.createObjectURL(blob)
        document.body.appendChild(link)
        link.click()//执行下载
        URL.revokeObjectURL(link.href) //释放url
        document.body.removeChild(link)//释放标签
      }
    }
  })
  connObj.on('close', () => {
    console.log('connObj close');
  })
  connObj.on('error', (err) => {
    connectServerStatus = 3;
    console.log('connObj error', err);
    connectStatus.value = 3;
    clearInterval(interval);
  })
}

selfOpen();
setInterval(() => {
  selfOpen();
}, 5000);

// ======================================文件上传部分===========================================
const handleChange = (info: UploadChangeParam) => {
  if (info.file.status !== 'uploading') {
    console.log(info.file, info.fileList);
  }
  if (info.file.status === 'done') {
    message.success(`${info.file.name} file uploaded successfully`);
  } else if (info.file.status === 'error') {
    message.error(`${info.file.name} file upload failed.`);
  }
};
const fileList = ref([]);

function beforeUploadFile(file: any, fileList: any) {
  console.log(file, fileList);
  if (connectStatus.value == 2) {
    connObj.send({"type": "send", "file": file, "name": file.name, "fileType": file.type});
  }
  return false;
}
</script>

<template>
  <div class="client-view">
    <div style="margin-bottom: 20px;">
      <IndicatorLight :code="connectStatus" @connect-server="selfOpen()"></IndicatorLight>
    </div>
    <a-upload
        v-model:file-list="fileList"
        name="file"
        :beforeUpload="beforeUploadFile"
    >
      <a-button>
        <upload-outlined></upload-outlined>
        点击选择文件
      </a-button>
    </a-upload>
  </div>
</template>

<style scoped>
.client-view {
  padding: 20px;
}
</style>