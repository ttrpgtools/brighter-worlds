import type { RemoteCtaReplyMessage, RemoteEmbedMessage } from '$lib/types';
import { type DataConnection, Peer } from 'peerjs';
import { type Readable, writable, readonly, type Writable } from 'svelte/store';

export class Session extends EventTarget {
  public id: Readable<string>;
  private connections: DataConnection[] = [];
  private pending: [string, string][] = [];
  private me: Peer;
  public count: Readable<number>;
  private makeConn: (to: string, name: string) => void;
  constructor(public gm: boolean = false) {
    super();
    const me = new Peer((null as unknown) as string , {debug: 3});
    const ccounter = writable(0);
    const sid = writable('');
    this.count = readonly(ccounter);
    this.id = readonly(sid);
    me.on('open', (id) => {
      sid.set(id);
      console.log('I AM', id);
      if (this.pending.length) {
        this.processPending();
      }
    });
    me.on('connection', (dc) => {
      console.log('RECEIVED CONNECTION', dc.metadata);
      this.addConnection(dc, ccounter);
      this.dispatchEvent(new CustomEvent('status', {
        detail: `New connection from ${dc.metadata.name}`,
      }));
    });
    me.on('error', err => {
      console.error('PEER ERROR', err);
      this.dispatchEvent(new CustomEvent('error', { detail: err }));
    });
    me.on('close', () => console.log('PEER CLOSED'));
    me.on('disconnected', (cid) => console.log('PEER DISCONNECTED', cid));
    this.me = me;
    this.makeConn = (to: string, name: string) => {
      const dc = this.me.connect(to, {
        metadata: {
          name
        },
        reliable: true,
      });
      this.addConnection(dc, ccounter);
    }
  }

  send(data: RemoteEmbedMessage | RemoteCtaReplyMessage) {
    console.log('SEND to', this.connections.length, 'connections');
    this.connections.forEach(dc => {
      console.log('SEND TO', dc);
      dc.send(data);
    });
    this.dispatchEvent(new CustomEvent('data', {
      detail: data
    }));
  }

  connect(to: string, name: string) {
    console.log('connect() ATTEMPT CONNECTION', to, name);
    if (!this.me.id) {
      console.log(`connect() Not initialized... add to pending.`);
      this.pending.push([to, name]);
    } else {
      console.log(`connect() Make connection`);
      this.makeConn(to, name);
    }
  }

  disconnect() {
    console.log('Disconnecting', this.connections.length, 'connections');
    this.connections.forEach(dc => {
      dc.close();
    });
  }

  private processPending() {
    console.log('PROCESSING', this.pending.length);
    this.pending.forEach(([to, name]) => {
      this.makeConn(to, name);
    });
    this.pending = [];
  }

  private addConnection(dc: DataConnection, cnt: Writable<number>) {
    console.log('ADD CONN', dc);
    dc.on('open', () => {
      console.log('CONNECTION OPEN', dc.metadata);
      this.connections.push(dc);
      cnt?.set(this.connections.length);
      if (this.gm) {
        this.dispatchEvent(new CustomEvent('join', {
          detail: {
            name: dc.metadata?.name,
            connection: dc,
          }
        }))
      }
    });
    dc.on('data', data => {
      console.log('DATA', data);
      this.dispatchEvent(new CustomEvent('data', {
        detail: {
          name: this.gm ? dc.metadata?.name : 'GM',
          data
        }
      }));
    });
    dc.on('error', err => {
      console.error('CONNECTION ERROR', err);
      this.connections = this.connections.filter(x => x.connectionId !== dc.connectionId);
      cnt?.set(this.connections.length);
      if (this.gm) {
        this.dispatchEvent(new CustomEvent('leave', {
          detail: {
            name: dc.metadata?.name,
            error: true,
          }
        }))
      }
    });
    dc.on('close', () => {
      console.log('CONNECTION CLOSED', dc.metadata);
      this.connections = this.connections.filter(x => x.connectionId !== dc.connectionId);
      cnt?.set(this.connections.length);
      if (this.gm) {
        this.dispatchEvent(new CustomEvent('leave', {
          detail: {
            name: dc.metadata?.name,
            error: false,
          }
        }))
      }
    })
  }
}

export function hostSession() {
  return new Session(true);
}

export function joinSession(id: string, name: string) {
  const session = new Session();
  //setTimeout(() => {
  //  console.log('DONE WAITING');
    session.connect(id, name);
  //}, 2000);
  return session;
}
