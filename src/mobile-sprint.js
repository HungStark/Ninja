// Distance between the two control centers, enlarged from the original layout.
export function sprintTargetOffset(padHeight,targetHeight){return 1.5*(padHeight/2+14+targetHeight/2);}
export function sprintTargetClearance(padHeight,targetHeight){return sprintTargetOffset(padHeight,targetHeight)-padHeight/2+targetHeight/2;}
