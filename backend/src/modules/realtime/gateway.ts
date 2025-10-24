import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: { origin: process.env.CORS_ORIGIN || '*' } })
export class RealtimeGateway {
  @WebSocketServer()
  server: Server;

  emitBooked(doctor_id: number, start_at: string) {
    this.server.emit('APPOINTMENT_BOOKED', { doctor_id, start_at });
  }
}
