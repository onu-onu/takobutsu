import dayjs from 'dayjs';
// UTCを使うためのおまじない
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);
// タイムゾーンを使うためのおまじない
import timezone from 'dayjs/plugin/timezone';
dayjs.extend(timezone);

export class Data {
    private _data: { dateStr: string, energy: number, cost: number }[] = [];

    constructor(rawData: any[]) {
        let e: any = {};
        let c: any = {};
        let keys: string[] = [];
        rawData.forEach(d => {
            let day: string = dayjs(d.startAt)
                .tz('Asia/Tokyo')
                .format('YYYY-MM-DD');
            if (keys.includes(day)) {
                c[day] += Number(d.costEstimate);
                e[day] += Number(d.value);
            } else {
                c[day] = Number(d.costEstimate);
                e[day] = Number(d.value);
                keys.push(day);
            }
        });
        this._data = keys.map((day: string) => {
            return {
                dateStr: day,
                energy: Math.floor(e[day] * 100) / 100,
                cost: Math.floor(c[day] * 100) / 100
            };
        });
        // console.log(this._data)
    }

    public get energy() {
        return this._data.map(d => {
            return {
                dateStr: d.dateStr,
                value: d.energy
            };
        });
    }
    public get cost() {
        return this._data.map(d => {
            return {
                dateStr: d.dateStr,
                value: d.cost
            };
        });
    }

    public sum() {
        let sumEnergy = 0;
        let sumCost = 0;
        this._data.forEach(d => {
            sumEnergy += d.energy;
            sumCost += d.cost;
        });
        return {
            cost: sumCost,
            energy: sumEnergy
        };
    }

    public dump() {
        this._data.forEach(d => console.log(d));
    }
}