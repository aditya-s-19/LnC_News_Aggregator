import { AppStateService } from "./services/app-state.service";
import { mainMenuPage } from "./pages/main-menu";

const appState = AppStateService.getInstance();

mainMenuPage();
