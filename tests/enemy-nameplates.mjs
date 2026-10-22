import assert from 'node:assert/strict';
import * as T from 'three';
import {projectEnemyLabel} from '../src/enemy-nameplates.js';
const camera=new T.PerspectiveCamera(60,915/412,.1,500);camera.position.set(0,1.7,10);camera.lookAt(0,1.7,-10);
const view={width:915,height:412},p=projectEnemyLabel(camera,[0,0,-10],3,view,70,22);assert.ok(p);assert.ok(p.headY-p.badgeBottom>=12);assert.ok(p.badgeBottom-p.panelBottom>=34);assert.ok(p.panelBottom-70>0);
const right=projectEnemyLabel(camera,[3,0,-10],3,view,70,22);assert.ok(right.x>p.x);
camera.lookAt(0,1.7,30);assert.equal(projectEnemyLabel(camera,[0,0,-10],3,view,70),null);
console.log('PASS: head projection follows movement, reserves space for burn/static badges, and hides enemies behind the camera.');
