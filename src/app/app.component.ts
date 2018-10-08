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

  @ViewChild('localVideo') localVideo: ElementRef;
  @ViewChild('remoteVideo') remoteVideo: ElementRef;
  constructor(private _signallingService: SignallingService) {
  }
  ngOnInit() {
    this.peerConnection = new RTCPeerConnection(this.servers);
    this.peerConnection2 = new RTCPeerConnection(this.servers);
    this.peerConnection2.ontrack = this.gotRemoteStream.bind(this);
    this.peerConnection.ontrack = this.gotRemoteStream.bind(this);
    console.log('startedpeerConnection');
    this.listenRemote();
  }
  listenRemote() {
    this._signallingService.onRemoteAnswer().subscribe((data) => {
      console.log('got answer from peer-2');
      this.addRemoteAnswer(data);
    })
    this._signallingService.onRemoteOffer().subscribe((data) => {
      console.log('got offer from peer-1');
      this.addRemoteOffer(data);
    })
    this._signallingService.onRemoteIce().subscribe((data) => {
      console.log('got ice from peer-1');
      this.addRemoteIce(data);
    })
    this._signallingService.onPeerIce().subscribe((data) => {
      console.log('got ice from peer-2');
      this.addPeerIce(data);
    })
  }
  addRemoteAnswer(answer) {
    this.peerConnection.setRemoteDescription(answer).then(
      () => {
        console.log('setting answer successfully')
      },
      (err) => {
        console.error('setting answer failed' + err)
      }
    );
  }
  gotRemoteStream(e) {
    console.log('got peer-2 stream succesfully');
    if (this.remoteVideo.nativeElement.srcObject !== e.streams[0]) {
      this.remoteVideo.nativeElement.srcObject = e.streams[0];
      console.log('set peer-2 stream succesfully');
    }
  }
  addRemoteIce(ice) {
    this.peerConnection2.addIceCandidate(ice)
      .then(
        () => {
          console.log('set peer-1 ice successfully');
        },
        (err) => {
          console.error('set peer-1 ice failed' + err);
        }
      );
  }
  addPeerIce(ice) {
    this.peerConnection.addIceCandidate(ice)
      .then(
        () => {
          console.warn('set peer-2 ice successfully');
        },
        (err) => {
          console.log('set peer-2 ice failed' + err);
        }
      );
  }
  addRemoteOffer(data) {
    this.localStream.getTracks().forEach(
      track => {
        this.peerConnection2.addTrack(
          track,
          this.localStream
        );
      }
    );
    this.peerConnection2.setRemoteDescription(data.offer).then(
      () => {
        this.remoteUser = data.from;
        console.log('set offer successfully');
        this.sendRemoteAnswer();
      },
      (err) => {
        console.error('set offer failed' + err)
      }
    );
  }
  sendRemoteAnswer() {
    this.peerConnection2.createAnswer().then(
      this.onAnswerCreated.bind(this),
      this.onAnswerFail.bind(this)
    );
  }
  onAnswerCreated(description) {
    let answer = description;
    console.info('generated answer sucessfully')
    this.peerConnection2.setLocalDescription(answer);
    this._signallingService.sendAnswer(answer, this.remoteUser);
    this.peerConnection2.onicecandidate = (ice) => {
      if (ice.candidate) {
        console.log('generated ice from peer-2');
        this._signallingService.sendPeerIce(ice.candidate, this.remoteUser);
      } else {
      }
    }
  }
  onAnswerFail(error) {
    console.warn('generating answer failed' + error);
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
    this.localStream.getTracks().forEach(
      track => {
        this.peerConnection.addTrack(
          track,
          this.localStream
        );
      }
    );
    this.peerConnection.onicecandidate = (ice) => {
      if (ice.candidate) {
        console.log('generated ice from peer-1');
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
