export const AUTO_SAVE_SECONDS=10;

// The restore point is independent of the live autosave, and never nests itself.
export function captureCheckpoint(save,point,{now=Date.now(),source='manual'}={}){
  save.checkpoint=save.village;
  const {checkpointSave:previous,...live}=save,snapshot=structuredClone(live);
  save.checkpointSave={version:1,source,pointId:point.id,village:save.village,label:point.label,savedAt:now,snapshot};
  return save.checkpointSave;
}
export function restoreCheckpoint(save){
  const point=save.checkpointSave;
  if(point?.version!==1||!point.snapshot)return false;
  const snapshot=structuredClone(point.snapshot),retained=structuredClone(point);delete snapshot.checkpointSave;
  for(const key of Object.keys(save))delete save[key];
  Object.assign(save,snapshot,{checkpointSave:retained});return true;
}
export function readCheckpoint(raw,decode){
  if(raw?.version!==1||!raw.snapshot||typeof raw.pointId!=='string'||typeof raw.label!=='string'||!Number.isFinite(raw.savedAt))return null;
  const snapshot=decode(raw.snapshot);if(!snapshot||snapshot.village!==raw.village)return null;
  delete snapshot.checkpointSave;
  return {version:1,source:raw.source==='initial'?'initial':'manual',pointId:raw.pointId,village:snapshot.village,label:raw.label,savedAt:raw.savedAt,snapshot};
}
export const checkpointSummary=save=>save.checkpointSave?{pointId:save.checkpointSave.pointId,village:save.checkpointSave.village,label:save.checkpointSave.label,savedAt:save.checkpointSave.savedAt,source:save.checkpointSave.source}:null;
