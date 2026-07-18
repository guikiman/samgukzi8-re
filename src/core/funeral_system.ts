/**
 * [98] 장례식 우호도 정산기 — FuneralSystem
 * 
 * 목적: 장례식 참석 시 우호도 상승.
 */
export class FuneralSystem {
    public attendFuneral(attendee: any, deceased: any): void {
        console.log(`[Social] ${attendee.name}이 ${deceased.name}의 장례식 참석.`);
    }
}
