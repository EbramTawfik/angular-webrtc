import { Injectable } from '@angular/core';
import * as io from 'socket.io-client';
import { Observable } from 'rxjs';

@Injectable({
	providedIn: 'root'
})
export class SignallingService {
	private socket;
	constructor() {
		this.connect();
	}
	connect() {
		this.socket = io('http://192.168.26.230:3000');
	}
	sendIce(ice: any, remoteUser: string) {
		console.log('ice from service');
		console.log(ice);
		this.socket.emit('send-ice', { ice: ice, to: remoteUser });
	}
	loginUser(user: string) {
		this.socket.emit('login', { user: user });
	}
	connectUser(user: string) {
		this.socket.emit('connect-user', { user: user });
	}
	sendOffer(offer: any, remoteUser: string) {
		this.socket.emit('send-offer', { offer: offer, to: remoteUser });
	}
	sendAnswer(answer: any, remoteUser: string) {
		this.socket.emit('send-answer', { answer: answer, to: remoteUser });
	}
	onRemoteIce(): Observable<any> {
		return Observable.create(observer => {
			this.socket.on('receive-ice', msg => {
				observer.next(msg);
			});
		});
	}
	onRemoteOffer(): Observable<any> {
		return Observable.create(observer => {
			this.socket.on('receive-offer', msg => {
				observer.next(msg);
			});
		});
	}
	onRemoteAnswer(): Observable<any> {
		return Observable.create(observer => {
			this.socket.on('receive-answer', msg => {
				observer.next(msg);
			});
		});
	}
}
