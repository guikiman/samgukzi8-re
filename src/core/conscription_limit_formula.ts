/**
 * [47] 징병 제한 공식기 — ConscriptionLimitFormula
 * 
 * 목적: 황폐화된 도시의 징병 제한.
 */
export class ConscriptionLimitFormula {
    public canConscript(city: any): boolean {
        return city.isDevastated ? false : true;
    }
}
