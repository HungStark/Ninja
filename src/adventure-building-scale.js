import * as T from 'three';

export const HOUSE_WIDTH_SCALE=1.2;
export const HOUSE_HEIGHT_SCALE=1.8;

export function houseShell(root,stilt=0){
  const shell=new T.Group();shell.name='house-shell';shell.scale.y=HOUSE_HEIGHT_SCALE;shell.position.y=stilt*(1-HOUSE_HEIGHT_SCALE);root.add(shell);
  root.userData.doorHeight=1.95*HOUSE_HEIGHT_SCALE;root.userData.doorWidth=1.25;
  return shell;
}
