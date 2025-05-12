import { createStore, SetStoreFunction } from "solid-js/store";

type Alert = {
    id: number;
    message: string;
    type: "success" | "error" | "info" | "warning";
};

class AlertManager {
    private alerts: Alert[] = [];
    private setAlerts: SetStoreFunction<Alert[]>;
    private nextId: number = 1;

    constructor() {
        const [alerts, setAlerts] = createStore<Alert[]>([]);

        this.alerts = alerts;
        this.setAlerts = setAlerts;
    }

    addAlert(
        message: string,
        type: "success" | "error" | "info" | "warning",
        duration: number = 1500
    ): void {
        const alert: Alert = { id: this.nextId++, message, type };
        this.setAlerts((alerts) => [...alerts, alert]);
        if (duration !== -1) {
            setTimeout(() => this.removeAlert(alert.id), duration);
        }
    }

    removeAlert(id: number): void {
        this.setAlerts((alerts) => alerts.filter((alert) => alert.id !== id));
    }

    getAlerts(): Alert[] {
        return this.alerts;
    }
}

const alertManager = new AlertManager();

export default alertManager as AlertManager;
export type { Alert };
