import dayjs from "dayjs";
import { Data } from "./Data";

export class DataSet {
    private _dataSet: { [YYYYMM: string]: Data } = {};
    public append(YYYYMM: string, data: Data) {
        this._dataSet[YYYYMM] = data;
    }

    public getCost(YYYYMM: string) {
        return this._dataSet[YYYYMM].cost;
    }

    public getEnergy(YYYYMM: string) {
        return this._dataSet[YYYYMM].energy;
    }

    public rangeDailyData(startYYYYMM: string, endYYYYMM: string) {
        let crntDayjs = dayjs(startYYYYMM);
        let endDayjs = dayjs(endYYYYMM);

        let costList: any[] = [];
        let energyList: any[] = [];
        while (crntDayjs <= endDayjs) {
            let key: string = crntDayjs.format('YYYY-MM');
            if (Object.keys(this._dataSet).includes(key)) {
                costList = costList.concat(this._dataSet[key].cost);
                energyList = energyList.concat(this._dataSet[key].energy);
            }
            crntDayjs = crntDayjs.add(1, 'M');
        }
        return {
            energy: energyList,
            cost: costList
        };
    }

    public rangeMonthlyData(startYYYY: string, endYYYY: string) {
        let crntDayjs = dayjs(`${startYYYY}-01`);
        let endDayjs = dayjs(`${endYYYY}-12`);
        // let costList: {dateStr:string, value:number}[] = [];
        let costList: any = [];
        let energyList: any = [];
        while (crntDayjs <= endDayjs) {
            let key: string = crntDayjs.format('YYYY-MM');
            if (Object.keys(this._dataSet).includes(key)) {
                let monthlyTotal = this._dataSet[key].sum();
                if (monthlyTotal.cost !== 0 && monthlyTotal.energy !== 0) {
                    costList.push({
                        dateStr: key,
                        value: monthlyTotal.cost
                    });

                    energyList.push({
                        dateStr: key,
                        value: monthlyTotal.energy
                    });
                }
            }
            crntDayjs = crntDayjs.add(1, 'M');
        }
        return {
            energy: energyList,
            cost: costList
        };
    }


    public hasDate(YYYYMM: string) {
        return YYYYMM in this._dataSet;
    }

    public dump() {
        Object.keys(this._dataSet).forEach(key => {
            this._dataSet[key].dump();
        });
    }
}