import * as React from 'react';
import '@client/less/style.less';
import { Persons } from '@client/app/Persons';

export function App() {
    return (
        <div className="app">
            <div className="app_header">
                <div style={{ fontSize: '80px', width: '100%', textAlign: 'center' }}>BIG HEADER</div>
            </div>
            <div className="app_content">
                <div style={{ fontSize: '120px', width: '100%', textAlign: 'center' }}>
                    <Persons></Persons>
                </div>
            </div>
        </div>
    );
}
