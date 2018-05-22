import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import enigma from 'enigma.js';
import schema from 'enigma.js/schemas/12.67.2.json';

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      appdetails: []
    };
  }

  fetchAppDetails() {
    var that = this;

      fetch('http://localhost:8080/api/v1/session/doc/cine').then(function (response) {
        return response.json();
      }).then(function (result) {

        //console.log(result.data.children);

        that.setState({ appdetails: result});



        console.log(that.state.appdetails);
      });
  }

  connectToEngine() {
    var that = this;
    console.log(that.state.appdetails);
    console.log('Creating and opening app using mixin.');

    var appdet = that.state.appdetails;

    //var url = 'ws://localhost:8080/engine/'+appdet.ip+'/'+appdet.port+'/'+appdet.sessionId+'/'+appdet.docId;
    var url = 'ws://localhost:'+'8080'+'/engine/'+appdet.ip+'/'+appdet.port+'/'+appdet.sessionId+'/'+appdet.docId;
    //var url = 'ws://localhost:'+'9076'+'/';
    console.log(url);
    that.session = enigma.create({
      schema,
      url,
      //createSocket: url => new WebSocket(url),
    });

    that.session.on('traffic:sent', data => console.log('sent:', data));
    that.session.on('traffic:received', data => console.log('received:', data));

    that.session.open().then(qix => {
      console.log("Engine Connected");
      console.log(qix);
      qix.getDocList().then(doc => {
        console.log("Get Document List");
        console.log(doc);
        that.session.close();
      });
    });
  };

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to React</h1>
        </header>
        <p className="App-intro">
          <button onClick={this.fetchAppDetails.bind(this)}>
            Fetch App Details
          </button>

          <button onClick={this.connectToEngine.bind(this)}>
            Connect to Engine
          </button>

        </p>
      </div>
    );
  }
}

export default App;
