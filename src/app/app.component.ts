import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
import { SignallingService } from './signalling.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  name: string;
  remoteUser: string;
  connectUser: string;
  localStream: MediaStream;
  remoteStream: MediaStream;
  peerConnection: any;
  peerConnection2: any;
  availableDevices: string[] = [];

  servers: any = null;
  offerOptions: RTCOfferOptions = {
    offerToReceiveAudio: 1,
    offerToReceiveVideo: 1
  }
//
  @ViewChild('localVideo') localVideo: ElementRef;
  @ViewChild('remoteVideo') remoteVideo: ElementRef;
  constructor(private _signallingService: SignallingService) {
  }
  ngOnInit() {
    this.peerConnection = new RTCPeerConnection(this.servers);
    this.peerConnection2 = new RTCPeerConnection(this.servers);
    console.log('startedpeerConnection');
    this.listenRemote();
    this.peerConnection2.ontrack = this.gotRemoteStream.bind(this);
  }
  listenRemote() {
    this._signallingService.onRemoteAnswer().subscribe((data) => {
      console.log('answer from remote');
      this.addRemoteAnswer(data);
    })
    this._signallingService.onRemoteOffer().subscribe((data) => {
      console.log('ice from remote');
      this.addRemoteOffer(data);
    })
    this._signallingService.onRemoteIce().subscribe((data) => {
      console.log('ice from remote');
      this.addRemoteIce(data);
    })
  }
  addRemoteAnswer(answer) {
    this.peerConnection.setRemoteDescription(answer).then(
      () => {
        console.log('added remote answer successfully')
        this.localStream.getTracks().forEach(
          track => {
            this.peerConnection.addTrack(
              track,
              this.localStream
            );
          }
        );
      },
      (err) => {
        console.warn('add remote answer failed' + err)
      }
    );
  }
  gotRemoteStream(e) {
    console.log('added remote stream succesfully');
    if (this.remoteVideo.nativeElement.srcObject !== e.streams[0]) {
      this.remoteVideo.nativeElement.srcObject = e.streams[0];
      console.log('added remote stream succesfully');
    }
  }
  addRemoteIce(ice) {
    console.log('ice from remote ice');
    console.log(ice);

    this.peerConnection2.addIceCandidate(ice)
      .then(
        () => {
          console.log('added remote ice successfully')
        },
        (err) => {
          console.log('add remote ice failed' + err)
        }
      );
  }
  addRemoteOffer(data) {
    this.peerConnection2.setRemoteDescription(data.offer).then(
      () => {
        console.log('added remote offer successfully');
        this.sendRemoteAnswer(data.from);
      },
      (err) => {
        console.warn('add remote offer failed' + err)
      }
    );
  }
  sendRemoteAnswer(from) {
    this.remoteUser = from;
    this.peerConnection2.createAnswer().then(
      this.onAnswerCreated.bind(this),
      this.onAnswerFail.bind(this)
    );
  }
  onAnswerCreated(description) {
    let answer = description;
    console.info('answer created sucessfully')
    console.log(answer);
    this.peerConnection2.setLocalDescription(answer);
    this._signallingService.sendAnswer(answer, this.remoteUser);
  }
  onAnswerFail(error) {
    console.warn('error creating answer' + error);
  }
  start() {
    navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true
    })
      .then(this.gotStream.bind(this))
      .catch(function (e) {
        alert('getUserMedia() error: ' + e.name);
      });
  }
  loginUser() {
    this._signallingService.loginUser(this.name);
  }

  gotStream(stream) {
    this.localVideo.nativeElement.srcObject = stream;
    this.localStream = stream;
    this.getUserDevice();
  }

  connectToUser() {
    if (this.connectUser) {
      this._signallingService.connectUser(this.connectUser);
      this.startPeerConnection();
    }
  }
  startPeerConnection() {
    this.peerConnection.onicecandidate = (ice) => {
      if (ice.candidate) {
        console.log('gotice');
        console.log(ice);
        this._signallingService.sendIce(ice.candidate, this.connectUser);
      } else {
        // All ICE candidates have been sent
      }
    }
    // @ts-ignore 
    this.peerConnection.createOffer(this.offerOptions).then(this.onOfferCreated.bind(this)).catch(this.onOfferFailure.bind(this));
  }

  onOfferCreated(description) {
    let offer = description;
    console.log(offer);
    this.peerConnection.setLocalDescription(offer);
    this._signallingService.sendOffer(offer, this.connectUser, this.name);
  }
  onOfferFailure(description) {
    console.log('failed to set description');
  }
  hangup() {
    this.localStream.getAudioTracks().forEach(tracks => {
      window.alert(tracks.label);
      tracks.stop();
    });
    this.localStream.getVideoTracks().forEach(tracks => {
      window.alert(tracks.label);
      tracks.stop();
    });
  }
  getUserDevice() {
    this.localStream.getAudioTracks().forEach(tracks => {
      this.availableDevices.push(tracks.label);
    });
    this.localStream.getVideoTracks().forEach(tracks => {
      this.availableDevices.push(tracks.label);
    });
    alert(this.availableDevices);
  }

}
