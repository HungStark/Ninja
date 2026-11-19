export const OPENING_SAVE_POINT='nameless-save-1';
export const CHIEF_BLESSING_LINE='Trước khi đến Đồi Chuông Gió, con hãy ghé Ấn hồi sinh ở ngay cạnh ta để xin thần linh phù hộ. Hãy chạm vào ấn để lưu lại hành trình. Nếu ngã xuống, con sẽ tỉnh lại ở đó.';
export const CHIEF_TREATMENT_LINE='Con bị thương rồi. Hãy tới trạm y tế để y tá trị thương và nạp đầy bình thuốc cho con trước khi bắt đầu hành trình mới.';
export const CHIEF_CHECKUP_LINE='Trước khi lên đường, con hãy ghé trạm y tế để y tá kiểm tra và nạp đầy bình thuốc cho con.';

export function openingTutorialStep(save){
  const {stage,openingTutorial}=save.story||{};
  if(!openingTutorial)return null;
  if(stage==='guardian'&&!openingTutorial.blessed)return 'blessing';
  if(stage==='report'&&!openingTutorial.treated)return 'treatment';
  return null;
}

export function openingTutorialObjective(save){
  const step=openingTutorialStep(save);
  if(step==='blessing')return {
    title:'Nhận lời phù hộ tại Ấn hồi sinh',
    description:'Tới Ấn hồi sinh cạnh trưởng làng và nhấn E hoặc chọn Lưu tiến trình để nhận lời phù hộ trước khi đến Đồi Chuông Gió.',
    targetVillage:'nameless',targetKind:'save',targetId:OPENING_SAVE_POINT
  };
  if(step==='treatment')return {
    title:'Hồi phục tại trạm y tế',
    description:'Tới gặp y tá và chọn Hồi phục để trị thương, nạp lại bình thuốc và chuẩn bị lên đường.',
    targetVillage:'nameless',targetKind:'clinic'
  };
  return null;
}
