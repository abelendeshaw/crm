import { initialDeals, type CrmDeal, DEFAULT_PIPELINE_STAGES, type PipelineStage, type ActivityType } from "./dealsManagementData";
import {
  initialLeads,
  type CrmLead,
  DEFAULT_LEAD_PIPELINE_STAGES,
} from "./leadsManagementData";
import { initialTargets, type SalesTarget } from "./salesTargetsData";

// Simple in-memory store for mock persistence within the session
class MockDealStore {
  private static instance: MockDealStore;
  private _deals: CrmDeal[] = [...initialDeals];
  private _stages: PipelineStage[] = [...DEFAULT_PIPELINE_STAGES];
  
  private _dealsSubscribers: ((deals: CrmDeal[]) => void)[] = [];
  private _stagesSubscribers: ((stages: PipelineStage[]) => void)[] = [];
  private _activityTypesSubscribers: ((types: ActivityType[]) => void)[] = [];
  private _targetsSubscribers: ((targets: SalesTarget[]) => void)[] = [];

  private _activityTypes: ActivityType[] = [
    {
      id: "act-type-1",
      name: "Call",
      icon: "Phone",
      description: "Outbound and inbound voice communication.",
      isDefault: true,
      order: 0,
    },
    {
      id: "act-type-2",
      name: "Meeting",
      icon: "Users",
      description: "Scheduled calendar events and virtual sessions.",
      order: 1,
    },
    {
      id: "act-type-3",
      name: "External",
      icon: "Globe",
      description: "Events recorded from integrated 3rd-party apps.",
      order: 2,
    },
  ];

  private _targets: SalesTarget[] = [...initialTargets];

  private constructor() {}

  public static getInstance(): MockDealStore {
    if (!MockDealStore.instance) {
      MockDealStore.instance = new MockDealStore();
    }
    return MockDealStore.instance;
  }

  public get deals(): CrmDeal[] {
    return this._deals;
  }

  public set deals(newDeals: CrmDeal[]) {
    this._deals = newDeals;
    this._notifyDeals();
  }

  public get stages(): PipelineStage[] {
    return this._stages;
  }

  public set stages(newStages: PipelineStage[]) {
    this._stages = newStages;
    this._notifyStages();
  }

  public get activityTypes(): ActivityType[] {
    return this._activityTypes;
  }

  public set activityTypes(newTypes: ActivityType[]) {
    this._activityTypes = newTypes;
    this._notifyActivityTypes();
  }

  public get targets(): SalesTarget[] {
    return this._targets;
  }

  public set targets(newTargets: SalesTarget[]) {
    this._targets = newTargets;
    this._notifyTargets();
  }

  public getDeal(id: string): CrmDeal | undefined {
    return this._deals.find(d => d.id === id);
  }

  public getTarget(id: string): SalesTarget | undefined {
    return this._targets.find(t => t.id === id);
  }

  public subscribeDeals(callback: (deals: CrmDeal[]) => void) {
    this._dealsSubscribers.push(callback);
    return () => {
      this._dealsSubscribers = this._dealsSubscribers.filter(s => s !== callback);
    };
  }

  public subscribeStages(callback: (stages: PipelineStage[]) => void) {
    this._stagesSubscribers.push(callback);
    return () => {
      this._stagesSubscribers = this._stagesSubscribers.filter(s => s !== callback);
    };
  }

  public subscribeActivityTypes(callback: (types: ActivityType[]) => void) {
    this._activityTypesSubscribers.push(callback);
    return () => {
      this._activityTypesSubscribers = this._activityTypesSubscribers.filter(s => s !== callback);
    };
  }

  public subscribeTargets(callback: (targets: SalesTarget[]) => void) {
    this._targetsSubscribers.push(callback);
    return () => {
      this._targetsSubscribers = this._targetsSubscribers.filter(s => s !== callback);
    };
  }

  private _notifyDeals() {
    this._dealsSubscribers.forEach(s => s(this._deals));
  }

  private _notifyStages() {
    this._stagesSubscribers.forEach(s => s(this._stages));
  }

  private _notifyActivityTypes() {
    this._activityTypesSubscribers.forEach(s => s(this._activityTypes));
  }

  private _notifyTargets() {
    this._targetsSubscribers.forEach(s => s(this._targets));
  }
}

export const mockDealStore = MockDealStore.getInstance();

class MockLeadStore {
  private static instance: MockLeadStore;
  private _leads: CrmLead[] = [...initialLeads];
  private _stages: PipelineStage[] = [...DEFAULT_LEAD_PIPELINE_STAGES];

  private _leadsSubscribers: ((leads: CrmLead[]) => void)[] = [];
  private _stagesSubscribers: ((stages: PipelineStage[]) => void)[] = [];
  private _activityTypesSubscribers: ((types: ActivityType[]) => void)[] = [];

  private _activityTypes: ActivityType[] = [
    {
      id: "lead-act-type-1",
      name: "Call",
      icon: "Phone",
      description: "Outbound and inbound voice communication.",
      isDefault: true,
      order: 0,
    },
    {
      id: "lead-act-type-2",
      name: "Meeting",
      icon: "Users",
      description: "Scheduled calendar events and virtual sessions.",
      order: 1,
    },
    {
      id: "lead-act-type-3",
      name: "External",
      icon: "Globe",
      description: "Events recorded from integrated 3rd-party apps.",
      order: 2,
    },
  ];

  private constructor() {}

  public static getInstance(): MockLeadStore {
    if (!MockLeadStore.instance) {
      MockLeadStore.instance = new MockLeadStore();
    }
    return MockLeadStore.instance;
  }

  public get leads(): CrmLead[] {
    return this._leads;
  }

  public set leads(newLeads: CrmLead[]) {
    this._leads = newLeads;
    this._notifyLeads();
  }

  public get stages(): PipelineStage[] {
    return this._stages;
  }

  public set stages(newStages: PipelineStage[]) {
    this._stages = newStages;
    this._notifyStages();
  }

  public get activityTypes(): ActivityType[] {
    return this._activityTypes;
  }

  public set activityTypes(newTypes: ActivityType[]) {
    this._activityTypes = newTypes;
    this._notifyActivityTypes();
  }

  public getLead(id: string): CrmLead | undefined {
    return this._leads.find((l) => l.id === id);
  }

  public subscribeLeads(callback: (leads: CrmLead[]) => void) {
    this._leadsSubscribers.push(callback);
    return () => {
      this._leadsSubscribers = this._leadsSubscribers.filter((s) => s !== callback);
    };
  }

  public subscribeStages(callback: (stages: PipelineStage[]) => void) {
    this._stagesSubscribers.push(callback);
    return () => {
      this._stagesSubscribers = this._stagesSubscribers.filter((s) => s !== callback);
    };
  }

  public subscribeActivityTypes(callback: (types: ActivityType[]) => void) {
    this._activityTypesSubscribers.push(callback);
    return () => {
      this._activityTypesSubscribers = this._activityTypesSubscribers.filter(
        (s) => s !== callback,
      );
    };
  }

  private _notifyLeads() {
    this._leadsSubscribers.forEach((s) => s(this._leads));
  }

  private _notifyStages() {
    this._stagesSubscribers.forEach((s) => s(this._stages));
  }

  private _notifyActivityTypes() {
    this._activityTypesSubscribers.forEach((s) => s(this._activityTypes));
  }
}

export const mockLeadStore = MockLeadStore.getInstance();
