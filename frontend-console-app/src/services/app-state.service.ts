import { UserState } from "../interfaces/app-state.interface";

export class AppStateService {
  private static instance: AppStateService;
  private user: UserState | null = null;
  private constructor() {}

  public static getInstance(): AppStateService {
    if (!AppStateService.instance) {
      AppStateService.instance = new AppStateService();
    }
    return AppStateService.instance;
  }

  public setUser(newState: UserState) {
    this.user = newState;
  }

  public getUser(): UserState | null {
    return this.user;
  }

  public resetUser() {
    this.user = null;
  }
}
