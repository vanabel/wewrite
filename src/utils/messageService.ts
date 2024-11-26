import { SrcThumbList } from "./SrcThumbList";

export class MessageService {
    private listeners: ((data: SrcThumbList) => void)[] = [];
  
    registerListener(listener: (data: SrcThumbList) => void) {
      this.listeners.push(listener);
    }
  
    sendMessage(data: SrcThumbList) {
      this.listeners.forEach(listener => listener(data));
    }
  }