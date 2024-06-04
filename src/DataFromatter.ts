import dayjs from 'dayjs';
// UTCを使うためのおまじない
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);
// タイムゾーンを使うためのおまじない
import timezone from 'dayjs/plugin/timezone';
dayjs.extend(timezone);

export class DataFromatter {
    private aggElectricEnergyData(rawData: any[], dayjsFormat: string): any {
        let tmp: any = {}
        rawData.forEach(d => {
            let day: string = dayjs(d.startAt)
                .tz('Asia/Tokyo')
                .format(dayjsFormat);
            if (day in tmp) {
                tmp[day] += Number(d.value);
            } else {
                tmp[day] = Number(d.value);
            }
        });
        return Object.keys(tmp).map((day: string) => {
            return {
                dateStr: day,
                value: tmp[day]
            };
        });
    }
   
    private aggEstimateCostData(rawData: any[], dayjsFormat: string): any {
        let tmp: any = {}
        rawData.forEach(d => {
            let day: string = dayjs(d.startAt)
                .tz('Asia/Tokyo')
                .format(dayjsFormat);
            if (day in tmp) {
                tmp[day] += Number(d.costEstimate);
            } else {
                tmp[day] = Number(d.costEstimate);
            }
        });
        return Object.keys(tmp).map((day: string) => {
            return {
                dateStr: day,
                value: tmp[day]
            };
        });
    }
    

    private electricEnergy2cost(electricEnergy: number) {
        const costPerKwhStep: number[] = [21.82, 27.19, 29.39];

        if (electricEnergy <= 120) {
            return electricEnergy * costPerKwhStep[0];
        } else if (electricEnergy <= 300) {
            return electricEnergy * costPerKwhStep[1];
        } else {
            return electricEnergy * costPerKwhStep[2];
        }
    }

    public dailyElectricEnergyData(rawData: any[]): any {
        return this.aggElectricEnergyData(rawData, 'YYYY-MM-DD');
    }

    public monthlyElectricEnergyData(rawData: any[]): any {
        return this.aggElectricEnergyData(rawData, 'YYYY-MM');
    }

    public dailyCumulativeTotalEstimateCostData(rawData: any[]): any {
        let dailyEstimateCost = this.aggEstimateCostData(rawData, 'YYYY-MM-DD');
        
        let cumulativeTotal = 0;
        return dailyEstimateCost.map((cost: any) => {
            cumulativeTotal += Number(cost.value);
            return {
                dateStr: cost.dateStr,
                value: cumulativeTotal
            }
        });
    }

    public costData(electricEnergyData: any[]) {
        return electricEnergyData.map((ee: any) => {
            return {
                value: this.electricEnergy2cost(ee.value),
                dateStr: ee.dateStr
            }
        });
    }

    public slice(data: any[], startDate: string, endDate: string) {
        return data.filter(d => dayjs(startDate).unix() <= dayjs(d.dateStr).unix() && dayjs(d.dateStr).unix() <= dayjs(endDate).unix());
    }
}