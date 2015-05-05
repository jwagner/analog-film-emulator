import asPromised from 'chai-as-promised';
chai.use(asPromised);

import sinonChai from 'sinon-chai';
chai.use(sinonChai);

import clut from './clut';
clut.root = '/';
