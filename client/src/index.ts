import * as ReactDOM from 'react-dom';
import * as React from 'react';
import { App } from '@client/app/App';

const rootContainer = document.getElementById('react-root');
ReactDOM.render(React.createElement(App), rootContainer);
