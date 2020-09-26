import * as ReactDOM from 'react-dom';
import * as React from 'react';
import { Test } from '@client/src/app/Test';

const rootContainer = document.getElementById('react-root');
ReactDOM.render(React.createElement(Test), rootContainer);
