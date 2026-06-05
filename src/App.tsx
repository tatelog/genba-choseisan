import {
  Bell,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Lock,
  LogIn,
  LogOut,
  Mail,
  Menu,
  Minus,
  Plus,
  Settings,
  Send,
  Table2,
  Truck,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from "react";

type Mark = "ok" | "maybe" | "ng" | "none";
type EventStatus = "調整中" | "確定候補あり" | "確定済";

type Member = {
  id: string;
  company: string;
  role: string;
  contact: string;
};

type StakeholderMaster = Member & {
  category: string;
  trade: string;
  foreman: string;
  email: string;
  area: string;
  zone: string;
  works: Array<"concrete" | "temporary">;
};

type ZoneAssignment = {
  id: string;
  area: string;
  zone: string;
  role: string;
  memberId: string;
};

type Candidate = {
  id: string;
  label: string;
  time: string;
  note: string;
};

type EventItem = {
  id: string;
  kind: string;
  title: string;
  site: string;
  owner: string;
  status: EventStatus;
  due: string;
  members: Member[];
  candidates: Candidate[];
  responses: Record<string, Record<string, Mark>>;
};

type DetailView = "table" | "calendar";
type ZoneNotation = "alphabet" | "circled" | "number";
type WorkMenu = "quantity" | "adjustment" | "settings";
type HolidayWorkMode = "closed" | "work";
type PlacementScheduleStatus = "draft" | "confirmed" | "canceled";

type WorkCalendarSettings = {
  holidayMode: HolidayWorkMode;
  saturdayClosedWeeks: number[];
};

type SiteSettings = {
  postalCode: string;
  address: string;
  latitude: string;
  longitude: string;
};

type WeatherForecastDay = {
  date: string;
  code: number;
  label: string;
  temperatureMax: number | null;
  temperatureMin: number | null;
  precipitationProbability: number | null;
};

type PlacementSchedule = {
  rowId: string;
  date: string;
  status: PlacementScheduleStatus;
  startTime?: string;
  confirmedAt?: string;
  updatedAt: string;
  canceledAt?: string;
  sourceRowId?: string;
};

type ConfirmedMovePrompt = {
  rowId: string;
  nextDate: string;
  currentDate: string;
};

type DraftMovePrompt = {
  rowId: string;
  date: string;
};

type ConfirmStartTimePrompt = {
  rowId: string;
  startTime: string;
};

type AdjustmentResponseRow = {
  count: number;
  candidateId: string;
  candidateLabel: string;
  candidateTime: string;
  memberId: string;
  company: string;
  mark: Mark;
};

type MainAppProps = {
  onLogout: () => void;
};

type ConcretePlacementRow = {
  id: string;
  zone: string;
  floor: string;
  branchNumber: string;
  concreteVolume: string;
  floorArea: string;
  mix: string;
  floorFinish: "木鏝" | "一回" | "二回";
  hasPipe: boolean;
  pipeLength: string;
  mixersPerHour: string;
  doubleTruck: "可" | "不可";
};

const floorOptions = ["B2F", "B1F", "1F", "2F", "3F", "4F", "5F"];
const initialMixMaster = ["普通 21-18-20N", "普通 24-18-20N", "普通 27-18-20N", "早強 24-18-20N"];
const floorFinishOptions: ConcretePlacementRow["floorFinish"][] = ["木鏝", "一回", "二回"];
const defaultZoneCount = 4;
const defaultZoneNotation: ZoneNotation = "alphabet";

const stakeholderMaster: StakeholderMaster[] = [
  { id: "plant", company: "東和生コン", role: "プラント", trade: "プラント", foreman: "佐藤", contact: "plant@example.jp", email: "plant@example.jp", area: "地下", zone: "A工区", category: "生コン", works: ["concrete"] },
  { id: "pump", company: "山城圧送", role: "ポンプ", trade: "ポンプ", foreman: "山田", contact: "pump@example.jp", email: "pump@example.jp", area: "地下", zone: "A工区", category: "生コン", works: ["concrete"] },
  { id: "earth", company: "大成土工", role: "土工", trade: "土工", foreman: "大野", contact: "earth@example.jp", email: "earth@example.jp", area: "地下", zone: "A工区", category: "躯体", works: ["concrete"] },
  { id: "floor", company: "日新土間", role: "土間", trade: "土間", foreman: "日高", contact: "floor@example.jp", email: "floor@example.jp", area: "地下", zone: "A工区", category: "仕上げ", works: ["concrete"] },
  { id: "carpenter", company: "東都大工", role: "大工", trade: "大工", foreman: "小林", contact: "carpenter@example.jp", email: "carpenter@example.jp", area: "地下", zone: "A工区", category: "躯体", works: ["concrete"] },
  { id: "rebar", company: "東都鉄筋", role: "鉄筋", trade: "鉄筋", foreman: "森", contact: "rebar@example.jp", email: "rebar@example.jp", area: "地上", zone: "B工区", category: "躯体", works: ["concrete"] },
  { id: "equipment", company: "北辰設備", role: "設備", trade: "設備", foreman: "田中", contact: "equipment@example.jp", email: "equipment@example.jp", area: "地下", zone: "B工区", category: "設備", works: ["concrete"] },
  { id: "trader", company: "丸都商事", role: "コンクリート商社", trade: "コンクリート商社", foreman: "井上", contact: "trader@example.jp", email: "trader@example.jp", area: "共通", zone: "共通", category: "生コン", works: ["concrete"] },
  { id: "delivery", company: "首都デリバリー", role: "デリバリー", trade: "デリバリー", foreman: "渡辺", contact: "delivery@example.jp", email: "delivery@example.jp", area: "共通", zone: "共通", category: "物流", works: ["concrete", "temporary"] },
  { id: "survey", company: "中央測量", role: "墨出し", trade: "墨出し", foreman: "中村", contact: "survey@example.jp", email: "survey@example.jp", area: "全体", zone: "共通", category: "管理", works: ["concrete", "temporary"] },
  { id: "lease", company: "中央リース", role: "リース", trade: "リース", foreman: "木村", contact: "lease@example.jp", email: "lease@example.jp", area: "地上", zone: "A工区", category: "仮設", works: ["temporary"] },
  { id: "transport", company: "中部運送", role: "運送", trade: "運送", foreman: "加藤", contact: "transport@example.jp", email: "transport@example.jp", area: "地上", zone: "A工区", category: "物流", works: ["temporary"] },
  { id: "scaffold", company: "共栄鳶", role: "鳶", trade: "鳶", foreman: "高橋", contact: "scaffold@example.jp", email: "scaffold@example.jp", area: "地上", zone: "B工区", category: "仮設", works: ["temporary"] },
  { id: "gate", company: "現場物流班", role: "ゲート", trade: "ゲート", foreman: "伊藤", contact: "gate@example.jp", email: "gate@example.jp", area: "外構", zone: "搬入路", category: "物流", works: ["temporary"] },
];

const assignmentRolesByWork = {
  concrete: ["コンクリート商社", "プラント", "ポンプ", "デリバリー", "土工", "土間", "大工", "鉄筋", "設備"],
  temporary: ["リース", "運送", "鳶", "ゲート"],
};
const initialZoneAssignments: ZoneAssignment[] = [
  { id: "assign-a-plant", area: "地下", zone: "A工区", role: "プラント", memberId: "plant" },
  { id: "assign-a-pump", area: "地下", zone: "A工区", role: "ポンプ", memberId: "pump" },
  { id: "assign-a-earth", area: "地下", zone: "A工区", role: "土工", memberId: "earth" },
  { id: "assign-a-floor", area: "地下", zone: "A工区", role: "土間", memberId: "floor" },
  { id: "assign-a-carpenter", area: "地下", zone: "A工区", role: "大工", memberId: "carpenter" },
  { id: "assign-a-equipment", area: "地下", zone: "B工区", role: "設備", memberId: "equipment" },
  { id: "assign-b-plant", area: "地上", zone: "B工区", role: "プラント", memberId: "plant" },
  { id: "assign-b-pump", area: "地上", zone: "B工区", role: "ポンプ", memberId: "pump" },
  { id: "assign-b-earth", area: "地上", zone: "B工区", role: "土工", memberId: "earth" },
  { id: "assign-b-floor", area: "地上", zone: "B工区", role: "土間", memberId: "floor" },
  { id: "assign-b-rebar", area: "地上", zone: "B工区", role: "鉄筋", memberId: "rebar" },
  { id: "assign-trader", area: "共通", zone: "共通", role: "コンクリート商社", memberId: "trader" },
  { id: "assign-delivery", area: "共通", zone: "共通", role: "デリバリー", memberId: "delivery" },
  { id: "assign-a-lease", area: "地上", zone: "A工区", role: "リース", memberId: "lease" },
  { id: "assign-a-transport", area: "地上", zone: "A工区", role: "運送", memberId: "transport" },
  { id: "assign-b-scaffold", area: "地上", zone: "B工区", role: "鳶", memberId: "scaffold" },
  { id: "assign-gate", area: "外構", zone: "搬入路", role: "ゲート", memberId: "gate" },
];

const initialPlacementRows: Record<string, ConcretePlacementRow[]> = {
  "ev-concrete": [
    {
      id: "row-1",
      zone: "A工区",
      floor: "B1F",
      branchNumber: "1",
      concreteVolume: "72",
      floorArea: "410",
      mix: "普通 24-18-20N",
      floorFinish: "木鏝",
      hasPipe: true,
      pipeLength: "48",
      mixersPerHour: "5",
      doubleTruck: "不可",
    },
    {
      id: "row-2",
      zone: "B工区",
      floor: "B1F",
      branchNumber: "",
      concreteVolume: "64",
      floorArea: "360",
      mix: "普通 24-18-20N",
      floorFinish: "一回",
      hasPipe: false,
      pipeLength: "",
      mixersPerHour: "4",
      doubleTruck: "可",
    },
  ],
  "ev-temporary": [],
};

const initialPlacementSchedules: Record<string, Record<string, PlacementSchedule>> = {
  "ev-concrete": {
    "row-1": {
      rowId: "row-1",
      date: "2026-06-17",
      status: "draft",
      updatedAt: "2026/06/04 09:00",
    },
  },
  "ev-temporary": {},
};

const events: EventItem[] = [
  {
    id: "ev-concrete",
    kind: "生コン打設",
    title: "B1F 土間コンクリート打設",
    site: "首都圏再開発 A工区",
    owner: "北原",
    status: "確定候補あり",
    due: "2026/06/12 17:00",
    members: [
      { id: "plant", company: "東和生コン", role: "プラント", contact: "plant@example.jp" },
      { id: "pump", company: "山城圧送", role: "ポンプ", contact: "pump@example.jp" },
      { id: "earth", company: "大成土工", role: "土工", contact: "earth@example.jp" },
      { id: "floor", company: "日新土間", role: "土間", contact: "floor@example.jp" },
    ],
    candidates: [
      { id: "d1", label: "6/17 水", time: "8:00-12:00", note: "午前打設。搬入ゲート A 使用" },
      { id: "d2", label: "6/18 木", time: "8:00-12:00", note: "ポンプ車は前日夕方搬入" },
      { id: "d3", label: "6/19 金", time: "13:00-17:00", note: "午後枠。仕上げ夜間注意" },
      { id: "d4", label: "6/22 月", time: "8:00-12:00", note: "工程上の最終許容日" },
    ],
    responses: {
      plant: { d1: "ok", d2: "ok", d3: "maybe", d4: "ng" },
      pump: { d1: "ok", d2: "ok", d3: "ok", d4: "maybe" },
      earth: { d1: "maybe", d2: "ok", d3: "ng", d4: "ok" },
      floor: { d1: "none", d2: "maybe", d3: "none", d4: "none" },
    },
  },
  {
    id: "ev-temporary",
    kind: "仮設手配",
    title: "外部足場材 搬入・組立",
    site: "首都圏再開発 A工区",
    owner: "石川",
    status: "調整中",
    due: "2026/06/10 12:00",
    members: [
      { id: "lease", company: "中央リース", role: "リース", contact: "lease@example.jp" },
      { id: "transport", company: "中部運送", role: "運送", contact: "transport@example.jp" },
      { id: "scaffold", company: "共栄鳶", role: "鳶", contact: "scaffold@example.jp" },
      { id: "gate", company: "現場物流班", role: "ゲート", contact: "gate@example.jp" },
    ],
    candidates: [
      { id: "t1", label: "6/15 月", time: "9:00-11:00", note: "10t 車 2 台" },
      { id: "t2", label: "6/16 火", time: "13:00-15:00", note: "ゲート B 優先" },
      { id: "t3", label: "6/17 水", time: "9:00-11:00", note: "生コン候補と干渉あり" },
    ],
    responses: {
      lease: { t1: "ok", t2: "maybe", t3: "ok" },
      transport: { t1: "maybe", t2: "ok", t3: "ng" },
      scaffold: { t1: "none", t2: "ok", t3: "none" },
      gate: { t1: "ok", t2: "ok", t3: "maybe" },
    },
  },
];

const eventSwitchLabels: Record<string, string> = {
  "ev-concrete": "生コン打設調整",
  "ev-temporary": "仮設車両調整",
};

const workMenus: { id: WorkMenu; label: string }[] = [
  { id: "quantity", label: "打設数量入力" },
  { id: "adjustment", label: "打設調整" },
  { id: "settings", label: "設定" },
];
const sampleLoginUserId = "genba-admin";
const sampleLoginPasswordHash = "d8d9df0685d4359039a5372dbd12fb48f5d2b5f82237bbac17e82966434c88ff";
const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
const saturdayWeekOptions = [1, 2, 3, 4, 5];
const defaultWorkCalendarSettings: WorkCalendarSettings = {
  holidayMode: "closed",
  saturdayClosedWeeks: [2, 4],
};

const defaultSiteSettings: SiteSettings = {
  postalCode: "100-0005",
  address: "東京都千代田区丸の内1丁目",
  latitude: "35.6812",
  longitude: "139.7671",
};

const weatherCodeLabels: Record<number, string> = {
  0: "快晴",
  1: "晴",
  2: "薄曇",
  3: "曇",
  45: "霧",
  48: "霧",
  51: "霧雨",
  53: "霧雨",
  55: "霧雨",
  61: "小雨",
  63: "雨",
  65: "強雨",
  66: "凍雨",
  67: "凍雨",
  71: "雪",
  73: "雪",
  75: "大雪",
  80: "にわか雨",
  81: "にわか雨",
  82: "強雨",
  85: "雪",
  86: "大雪",
  95: "雷雨",
  96: "雷雨",
  99: "雷雨",
};

const japaneseHolidays: Record<string, string> = {
  "2026-01-01": "元日",
  "2026-01-12": "成人の日",
  "2026-02-11": "建国記念の日",
  "2026-02-23": "天皇誕生日",
  "2026-03-20": "春分の日",
  "2026-04-29": "昭和の日",
  "2026-05-03": "憲法記念日",
  "2026-05-04": "みどりの日",
  "2026-05-05": "こどもの日",
  "2026-05-06": "振替休日",
  "2026-07-20": "海の日",
  "2026-08-11": "山の日",
  "2026-09-21": "敬老の日",
  "2026-09-22": "国民の休日",
  "2026-09-23": "秋分の日",
  "2026-10-12": "スポーツの日",
  "2026-11-03": "文化の日",
  "2026-11-23": "勤労感謝の日",
  "2027-01-01": "元日",
  "2027-01-11": "成人の日",
  "2027-02-11": "建国記念の日",
  "2027-02-23": "天皇誕生日",
  "2027-03-21": "春分の日",
  "2027-03-22": "振替休日",
  "2027-04-29": "昭和の日",
  "2027-05-03": "憲法記念日",
  "2027-05-04": "みどりの日",
  "2027-05-05": "こどもの日",
  "2027-07-19": "海の日",
  "2027-08-11": "山の日",
  "2027-09-20": "敬老の日",
  "2027-09-23": "秋分の日",
  "2027-10-11": "スポーツの日",
  "2027-11-03": "文化の日",
  "2027-11-23": "勤労感謝の日",
};

const markLabels: Record<Mark, string> = {
  ok: "○",
  maybe: "△",
  ng: "×",
  none: "-",
};

const scheduleStatusLabels: Record<PlacementScheduleStatus, string> = {
  draft: "未確定",
  confirmed: "確定",
  canceled: "キャンセル",
};

const markText: Record<Mark, string> = {
  ok: "対応可",
  maybe: "調整可",
  ng: "不可",
  none: "未回答",
};

function scoreCandidate(event: EventItem, candidateId: string) {
  const marks = event.members.map((member) => event.responses[member.id]?.[candidateId] ?? "none");
  return {
    ok: marks.filter((mark) => mark === "ok").length,
    maybe: marks.filter((mark) => mark === "maybe").length,
    ng: marks.filter((mark) => mark === "ng").length,
    none: marks.filter((mark) => mark === "none").length,
    total: marks.length,
  };
}

async function sha256Hex(value: string) {
  const buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function getCandidateTone(score: ReturnType<typeof scoreCandidate>) {
  if (score.ng > 0) return "blocked";
  if (score.none > 0) return "waiting";
  if (score.maybe > 0) return "soft";
  return "best";
}

function buildAdjustmentResponseRows(event: EventItem): AdjustmentResponseRow[] {
  return event.candidates.flatMap((candidate, candidateIndex) =>
    event.members.map((member) => ({
      count: candidateIndex + 1,
      candidateId: candidate.id,
      candidateLabel: candidate.label,
      candidateTime: candidate.time,
      memberId: member.id,
      company: member.company,
      mark: event.responses[member.id]?.[candidate.id] ?? "none",
    }))
  );
}

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem("genba-auth") === "ok");

  function handleLoginSuccess() {
    localStorage.setItem("genba-auth", "ok");
    setIsAuthenticated(true);
  }

  function handleLogout() {
    localStorage.removeItem("genba-auth");
    setIsAuthenticated(false);
  }

  return isAuthenticated ? <MainApp onLogout={handleLogout} /> : <LoginScreen onLogin={handleLoginSuccess} />;
}

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isChecking, setIsChecking] = useState(false);

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsChecking(true);
    setError("");
    try {
      const passwordHash = await sha256Hex(password);
      if (userId.trim() === sampleLoginUserId && passwordHash === sampleLoginPasswordHash) {
        onLogin();
        return;
      }
      setError("ユーザーIDまたはパスワードが違います。");
    } finally {
      setIsChecking(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="login-panel" aria-label="ログイン">
        <div className="login-brand">
          <div className="brand-mark">調</div>
          <div>
            <p>現場内調整さん</p>
            <span>関係者向けログイン</span>
          </div>
        </div>
        <form className="login-form" onSubmit={submitLogin}>
          <div>
            <p className="eyebrow">サンプル認証</p>
            <h1>ログイン</h1>
          </div>
          <label>
            <span>ユーザーID</span>
            <input
              autoComplete="username"
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              placeholder="ユーザーID"
            />
          </label>
          <label>
            <span>パスワード</span>
            <input
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="パスワード"
              type="password"
            />
          </label>
          {error && <p className="login-error">{error}</p>}
          <button className="primary-button" disabled={isChecking} type="submit">
            {isChecking ? <Lock size={17} /> : <LogIn size={17} />}
            ログイン
          </button>
        </form>
      </section>
    </main>
  );
}

function MainApp({ onLogout }: MainAppProps) {
  const [activeId, setActiveId] = useState(events[0].id);
  const [selectedMember, setSelectedMember] = useState(events[0].members[3].id);
  const [draftResponses, setDraftResponses] = useState(events[0].responses);
  const [detailView, setDetailView] = useState<DetailView>("table");
  const [placementRowsByEvent, setPlacementRowsByEvent] = useState(initialPlacementRows);
  const [placementSchedulesByEvent, setPlacementSchedulesByEvent] = useState(initialPlacementSchedules);
  const [membersByEvent, setMembersByEvent] = useState<Record<string, Member[]>>(
    Object.fromEntries(events.map((event) => [event.id, event.members]))
  );
  const [zoneAssignments, setZoneAssignments] = useState(initialZoneAssignments);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeWorkMenu, setActiveWorkMenu] = useState<WorkMenu>("quantity");
  const [calendarMonthOffset, setCalendarMonthOffset] = useState(0);
  const [workCalendarSettings, setWorkCalendarSettings] = useState(defaultWorkCalendarSettings);
  const [siteSettings, setSiteSettings] = useState(defaultSiteSettings);
  const [weatherForecasts, setWeatherForecasts] = useState<Record<string, WeatherForecastDay>>({});
  const [weatherStatus, setWeatherStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [mixMaster, setMixMaster] = useState(initialMixMaster);
  const [confirmedMovePrompt, setConfirmedMovePrompt] = useState<ConfirmedMovePrompt | null>(null);
  const [draftMovePrompt, setDraftMovePrompt] = useState<DraftMovePrompt | null>(null);
  const [confirmStartTimePrompt, setConfirmStartTimePrompt] = useState<ConfirmStartTimePrompt | null>(null);
  const [editingPlacementRows, setEditingPlacementRows] = useState<Record<string, boolean>>({});
  const [invalidPlacementRows, setInvalidPlacementRows] = useState<Record<string, boolean>>({});

  const activeEvent = events.find((event) => event.id === activeId) ?? events[0];
  const activeMembers = membersByEvent[activeEvent.id] ?? activeEvent.members;
  const zoneOptions = getZoneOptions(defaultZoneCount, defaultZoneNotation);
  const placementRows = placementRowsByEvent[activeEvent.id] ?? [];
  const placementSchedules = placementSchedulesByEvent[activeEvent.id] ?? {};
  const mixOptions = mixMaster.map((mix) => mix.trim()).filter(Boolean);
  const isConcreteEvent = activeEvent.kind.includes("生コン");
  const activeWorkType = isConcreteEvent ? "concrete" : "temporary";
  const visibleStakeholderMaster = stakeholderMaster.filter((member) => member.works.includes(activeWorkType));
  const assignmentRoles = assignmentRolesByWork[activeWorkType];
  const areaZoneOptions = getAreaZoneOptions(visibleStakeholderMaster, zoneAssignments, assignmentRoles);
  const activeWorkMenuLabel = workMenus.find((menu) => menu.id === activeWorkMenu)?.label ?? "";
  const pageTitle = activeWorkMenuLabel;
  const hasInvalidPlacementRows = placementRows.some(
    (row) => invalidPlacementRows[row.id] && isPlacementPlanIncomplete(row, getActiveSchedule(placementSchedules, row.id))
  );
  const placementStats = {
    volume: placementRows.reduce((sum, row) => sum + Number(row.concreteVolume || 0), 0),
    floorArea: placementRows.reduce((sum, row) => sum + Number(row.floorArea || 0), 0),
    requiredMissing: placementRows.reduce((sum, row) => {
      const requiredValues = [row.zone, row.floor, row.concreteVolume, row.floorArea, row.mix, row.floorFinish];
      return sum + requiredValues.filter((value) => !String(value).trim()).length;
    }, 0),
  };

  const rankedCandidates = useMemo(() => {
    const eventForScoring = { ...activeEvent, members: activeMembers, responses: draftResponses };
    return activeEvent.candidates
      .map((candidate) => ({ candidate, score: scoreCandidate(eventForScoring, candidate.id) }))
      .sort((a, b) => b.score.ok - a.score.ok || a.score.ng - b.score.ng || a.score.none - b.score.none);
  }, [activeEvent, activeMembers, draftResponses]);
  const adjustmentResponseRows = useMemo(
    () => buildAdjustmentResponseRows({ ...activeEvent, members: activeMembers, responses: draftResponses }),
    [activeEvent, activeMembers, draftResponses]
  );
  const preferredCandidate = rankedCandidates[0];
  const candidatePlacementList = useMemo(
    () =>
      placementRows.flatMap((row) => {
        const activeSchedule = getActiveSchedule(placementSchedules, row.id);
        if (activeSchedule?.status === "confirmed") return [];
        const scheduleLabel =
          preferredCandidate
            ? `${preferredCandidate.candidate.label.replace(/\s.+$/, "")} 未確定`
            : "未確定";
        const scheduleTone = preferredCandidate ? getCandidateTone(preferredCandidate.score) : "waiting";
        return [{ row, activeSchedule, scheduleLabel, scheduleTone }];
      }),
    [placementRows, placementSchedules, preferredCandidate]
  );

  const selectedMemberInfo =
    activeMembers.find((member) => member.id === selectedMember) ?? activeMembers[0];
  const placementMonths = useMemo(
    () =>
      buildPlacementMonths(
        activeEvent,
        placementRows,
        placementSchedules,
        calendarMonthOffset,
        workCalendarSettings,
        weatherForecasts
      ),
    [activeEvent, placementRows, placementSchedules, calendarMonthOffset, workCalendarSettings, weatherForecasts]
  );
  const unassignedPlacementRows = placementRows.filter((row) => !getActiveSchedule(placementSchedules, row.id));
  const confirmStartRow = confirmStartTimePrompt
    ? placementRows.find((row) => row.id === confirmStartTimePrompt.rowId)
    : undefined;
  const confirmStartSchedule = confirmStartTimePrompt ? placementSchedules[confirmStartTimePrompt.rowId] : undefined;

  useEffect(() => {
    const latitude = Number(siteSettings.latitude);
    const longitude = Number(siteSettings.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      setWeatherForecasts({});
      setWeatherStatus("idle");
      return;
    }

    const controller = new AbortController();
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", String(latitude));
    url.searchParams.set("longitude", String(longitude));
    url.searchParams.set("daily", "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max");
    url.searchParams.set("timezone", "Asia/Tokyo");
    url.searchParams.set("forecast_days", "16");

    setWeatherStatus("loading");
    fetch(url, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`weather api ${response.status}`);
        return response.json();
      })
      .then((data) => {
        setWeatherForecasts(parseWeatherForecasts(data));
        setWeatherStatus("ready");
      })
      .catch((error) => {
        if (error.name === "AbortError") return;
        setWeatherForecasts({});
        setWeatherStatus("error");
      });

    return () => controller.abort();
  }, [siteSettings.latitude, siteSettings.longitude]);

  function changeEvent(eventId: string) {
    const next = events.find((event) => event.id === eventId) ?? events[0];
    const nextMembers = membersByEvent[next.id] ?? next.members;
    setActiveId(eventId);
    setSelectedMember(nextMembers[0].id);
    setDraftResponses(next.responses);
    setActiveWorkMenu("quantity");
    setCalendarMonthOffset(0);
  }

  function toggleSaturdayClosedWeek(week: number) {
    setWorkCalendarSettings((current) => ({
      ...current,
      saturdayClosedWeeks: current.saturdayClosedWeeks.includes(week)
        ? current.saturdayClosedWeeks.filter((value) => value !== week)
        : [...current.saturdayClosedWeeks, week].sort((a, b) => a - b),
    }));
  }

  function updateSiteSetting(field: keyof SiteSettings, value: string) {
    setSiteSettings((current) => ({ ...current, [field]: value }));
  }

  function schedulePlacementRow(rowId: string, dateKey: string) {
    const currentSchedule = placementSchedules[rowId];
    if (currentSchedule?.status === "confirmed" && currentSchedule.date !== dateKey) {
      setConfirmedMovePrompt({ rowId, currentDate: currentSchedule.date, nextDate: dateKey });
      return;
    }

    upsertPlacementSchedule(rowId, dateKey);
    if (currentSchedule?.status === "draft" && currentSchedule.date !== dateKey) {
      setDraftMovePrompt({ rowId, date: dateKey });
    }
  }

  function upsertPlacementSchedule(rowId: string, dateKey: string) {
    const updatedAt = getNowLabel();
    setPlacementSchedulesByEvent((current) => ({
      ...current,
      [activeEvent.id]: {
        ...(current[activeEvent.id] ?? {}),
        [rowId]: {
          ...(current[activeEvent.id]?.[rowId] ?? { rowId, status: "draft" as PlacementScheduleStatus }),
          rowId,
          date: dateKey,
          status: current[activeEvent.id]?.[rowId]?.status === "canceled" ? "draft" : current[activeEvent.id]?.[rowId]?.status ?? "draft",
          updatedAt,
        },
      },
    }));
  }

  function confirmPlacementSchedule(rowId: string) {
    const schedule = placementSchedules[rowId];
    if (!schedule || schedule.status === "canceled") return;
    setConfirmStartTimePrompt({
      rowId,
      startTime: schedule.startTime || getDefaultPlacementStartTime(schedule.date, activeEvent),
    });
  }

  function finalizePlacementConfirmation() {
    if (!confirmStartTimePrompt) return;
    const startTime = confirmStartTimePrompt.startTime.trim();
    if (!startTime) return;
    const now = getNowLabel();
    setPlacementSchedulesByEvent((current) => {
      const schedule = current[activeEvent.id]?.[confirmStartTimePrompt.rowId];
      if (!schedule || schedule.status === "canceled") return current;
      return {
        ...current,
        [activeEvent.id]: {
          ...(current[activeEvent.id] ?? {}),
          [confirmStartTimePrompt.rowId]: {
            ...schedule,
            status: "confirmed",
            startTime,
            confirmedAt: schedule.confirmedAt ?? now,
            updatedAt: now,
          },
        },
      };
    });
    setConfirmStartTimePrompt(null);
  }

  function confirmDraftMoveSchedule() {
    if (!draftMovePrompt) return;
    confirmPlacementSchedule(draftMovePrompt.rowId);
    setDraftMovePrompt(null);
  }

  function moveConfirmedPlacementWithCancel() {
    if (!confirmedMovePrompt) return;
    const sourceRow = placementRows.find((row) => row.id === confirmedMovePrompt.rowId);
    if (!sourceRow) {
      setConfirmedMovePrompt(null);
      return;
    }

    const now = getNowLabel();
    const clonedRow: ConcretePlacementRow = {
      ...sourceRow,
      id: `row-${Date.now()}`,
    };

    setPlacementRowsByEvent((current) => ({
      ...current,
      [activeEvent.id]: [...(current[activeEvent.id] ?? []), clonedRow],
    }));
    setPlacementSchedulesByEvent((current) => ({
      ...current,
      [activeEvent.id]: {
        ...(current[activeEvent.id] ?? {}),
        [confirmedMovePrompt.rowId]: {
          ...(current[activeEvent.id]?.[confirmedMovePrompt.rowId] ?? {
            rowId: confirmedMovePrompt.rowId,
            date: confirmedMovePrompt.currentDate,
            status: "confirmed" as PlacementScheduleStatus,
          }),
          status: "canceled",
          canceledAt: now,
          updatedAt: now,
        },
        [clonedRow.id]: {
          rowId: clonedRow.id,
          date: confirmedMovePrompt.nextDate,
          status: "draft",
          updatedAt: now,
          sourceRowId: confirmedMovePrompt.rowId,
        },
      },
    }));
    setConfirmedMovePrompt(null);
  }

  function moveConfirmedPlacementWithoutCancel() {
    if (!confirmedMovePrompt) return;
    upsertPlacementSchedule(confirmedMovePrompt.rowId, confirmedMovePrompt.nextDate);
    setConfirmedMovePrompt(null);
  }

  function updateMemberMark(memberId: string, candidateId: string, mark: Mark) {
    setDraftResponses((current) => ({
      ...current,
      [memberId]: {
        ...current[memberId],
        [candidateId]: mark,
      },
    }));
    setSelectedMember(memberId);
  }

  function updateMark(candidateId: string, mark: Mark) {
    updateMemberMark(selectedMemberInfo.id, candidateId, mark);
  }

  const responseEvent = { ...activeEvent, members: activeMembers, responses: draftResponses };

  function addMemberFromMaster(masterMember: StakeholderMaster) {
    const alreadyInEvent = activeMembers.some((member) => member.id === masterMember.id);
    if (alreadyInEvent) return;

    const nextMember: Member = {
      id: masterMember.id,
      company: masterMember.company,
      role: masterMember.role,
      contact: masterMember.contact,
    };

    setMembersByEvent((current) => ({
      ...current,
      [activeEvent.id]: [...activeMembers, nextMember],
    }));
    setDraftResponses((current) => ({
      ...current,
      [nextMember.id]: Object.fromEntries(activeEvent.candidates.map((candidate) => [candidate.id, "none" as Mark])),
    }));
    setSelectedMember(nextMember.id);
  }

  function updateZoneAssignment(area: string, zone: string, role: string, memberId: string) {
    setZoneAssignments((current) => {
      const existing = current.find(
        (assignment) => assignment.area === area && assignment.zone === zone && assignment.role === role
      );
      if (existing) {
        return current.map((assignment) =>
          assignment.id === existing.id ? { ...assignment, memberId } : assignment
        );
      }
      return [
        ...current,
        {
          id: `assign-${area}-${zone}-${role}`,
          area,
          zone,
          role,
          memberId,
        },
      ];
    });
  }

  function getAssignedMemberId(area: string, zone: string, role: string) {
    return (
      zoneAssignments.find(
        (assignment) => assignment.area === area && assignment.zone === zone && assignment.role === role
      )?.memberId ?? ""
    );
  }

  function addMixMasterItem() {
    setMixMaster((current) => [...current, `新規配合 ${current.length + 1}`]);
  }

  function updateMixMasterItem(index: number, value: string) {
    const previousValue = mixMaster[index];
    setMixMaster((current) => current.map((mix, mixIndex) => (mixIndex === index ? value : mix)));
    if (!previousValue) return;
    setPlacementRowsByEvent((current) =>
      Object.fromEntries(
        Object.entries(current).map(([eventId, rows]) => [
          eventId,
          rows.map((row) => (row.mix === previousValue ? { ...row, mix: value } : row)),
        ])
      )
    );
  }

  function removeMixMasterItem(index: number) {
    if (mixMaster.length <= 1) return;
    const removedValue = mixMaster[index];
    const fallbackMix = mixMaster.find((_, mixIndex) => mixIndex !== index) ?? "";
    setMixMaster((current) => current.filter((_, mixIndex) => mixIndex !== index));
    setPlacementRowsByEvent((current) =>
      Object.fromEntries(
        Object.entries(current).map(([eventId, rows]) => [
          eventId,
          rows.map((row) => (row.mix === removedValue ? { ...row, mix: fallbackMix } : row)),
        ])
      )
    );
  }

  function addPlacementRow() {
    const nextRowId = `row-${Date.now()}`;
    const nextRow: ConcretePlacementRow = {
      id: nextRowId,
      zone: zoneOptions[0],
      floor: floorOptions[1],
      branchNumber: "",
      concreteVolume: "",
      floorArea: "",
      mix: mixOptions[1] ?? mixOptions[0] ?? "",
      floorFinish: "木鏝",
      hasPipe: false,
      pipeLength: "",
      mixersPerHour: "",
      doubleTruck: "不可",
    };

    setPlacementRowsByEvent((current) => ({
      ...current,
      [activeEvent.id]: [nextRow, ...(current[activeEvent.id] ?? [])],
    }));
    setEditingPlacementRows((current) => ({ ...current, [nextRowId]: true }));
    setInvalidPlacementRows((current) => {
      const next = { ...current };
      delete next[nextRowId];
      return next;
    });
  }

  function togglePlacementRowEdit(rowId: string) {
    const row = placementRows.find((placementRow) => placementRow.id === rowId);
    const activeSchedule = getActiveSchedule(placementSchedules, rowId);
    const isEditing = Boolean(editingPlacementRows[rowId]);
    if (isEditing && row && isPlacementPlanIncomplete(row, activeSchedule)) {
      setInvalidPlacementRows((current) => ({ ...current, [rowId]: true }));
      return;
    }
    if (isEditing) {
      setInvalidPlacementRows((current) => {
        const next = { ...current };
        delete next[rowId];
        return next;
      });
    }
    setEditingPlacementRows((current) => ({ ...current, [rowId]: !current[rowId] }));
  }

  function updatePlacementScheduleDate(rowId: string, value: string) {
    if (!value) return;
    schedulePlacementRow(rowId, value);
    const row = placementRows.find((placementRow) => placementRow.id === rowId);
    if (row && !isPlacementPlanIncomplete(row, { rowId, date: value, status: "draft", updatedAt: "" })) {
      setInvalidPlacementRows((current) => {
        const next = { ...current };
        delete next[rowId];
        return next;
      });
    }
  }

  function deletePlacementRow(rowId: string) {
    setPlacementRowsByEvent((current) => ({
      ...current,
      [activeEvent.id]: (current[activeEvent.id] ?? []).filter((row) => row.id !== rowId),
    }));
    setPlacementSchedulesByEvent((current) => {
      const nextSchedules = { ...(current[activeEvent.id] ?? {}) };
      delete nextSchedules[rowId];
      return { ...current, [activeEvent.id]: nextSchedules };
    });
    setEditingPlacementRows((current) => {
      const next = { ...current };
      delete next[rowId];
      return next;
    });
    setInvalidPlacementRows((current) => {
      const next = { ...current };
      delete next[rowId];
      return next;
    });
  }

  function updatePlacementRow(
    rowId: string,
    field: keyof ConcretePlacementRow,
    value: ConcretePlacementRow[keyof ConcretePlacementRow]
  ) {
    setPlacementRowsByEvent((current) => ({
      ...current,
      [activeEvent.id]: (current[activeEvent.id] ?? []).map((row) =>
        row.id === rowId ? { ...row, [field]: value } : row
      ),
    }));
    const currentRow = placementRows.find((row) => row.id === rowId);
    if (currentRow) {
      const nextRow = { ...currentRow, [field]: value };
      if (!isPlacementPlanIncomplete(nextRow, getActiveSchedule(placementSchedules, rowId))) {
        setInvalidPlacementRows((current) => {
          const next = { ...current };
          delete next[rowId];
          return next;
        });
      }
    }
  }

  function stepPlacementNumber(rowId: string, field: "concreteVolume" | "floorArea", delta: number) {
    setPlacementRowsByEvent((current) => ({
      ...current,
      [activeEvent.id]: (current[activeEvent.id] ?? []).map((row) => {
        if (row.id !== rowId) return row;
        const currentValue = Number(row[field] || 0);
        return { ...row, [field]: String(Math.max(0, currentValue + delta)) };
      }),
    }));
  }

  return (
    <div className={`app-shell ${isSidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
      <aside className="sidebar" aria-label="メインメニュー">
        <div className="brand">
          <div className="brand-identity">
            <div className="brand-mark">調</div>
            <div className="brand-text">
              <p>現場内調整さん</p>
              <span>現場予定調整</span>
            </div>
          </div>
          <button
            aria-label={isSidebarOpen ? "メニューを閉じる" : "メニューを開く"}
            className="menu-toggle-button"
            onClick={() => setIsSidebarOpen((current) => !current)}
            title={isSidebarOpen ? "メニューを閉じる" : "メニューを開く"}
            type="button"
          >
            <Menu size={18} />
          </button>
        </div>

        <label className="construction-switch">
          <span>工事切替</span>
          <select value={activeId} onChange={(event) => changeEvent(event.target.value)}>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {eventSwitchLabels[event.id] ?? event.kind}
              </option>
            ))}
          </select>
        </label>

        <nav className="collapsed-construction-switch" aria-label="工事切替">
          <div
            aria-label={activeId === "ev-concrete" ? "打設" : "仮設"}
            className="collapsed-construction-current"
            title={activeId === "ev-concrete" ? "打設" : "仮設"}
          >
            {activeId === "ev-concrete" ? <MixerTruckIcon /> : <UnicTruckIcon />}
            <span>{activeId === "ev-concrete" ? "打設" : "仮設"}</span>
          </div>
        </nav>

        <nav className="work-menu" aria-label="工事メニュー">
          {workMenus.map((menu) => (
            <button
              className={activeWorkMenu === menu.id ? "active" : ""}
              key={menu.id}
              onClick={() => setActiveWorkMenu(menu.id)}
              type="button"
            >
              {menu.id === "quantity" && <Table2 size={16} />}
              {menu.id === "adjustment" && <CalendarDays size={16} />}
              {menu.id === "settings" && <Settings size={16} />}
              <span>{menu.label}</span>
            </button>
          ))}
        </nav>

      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">{activeEvent.site}</p>
            <h1>{pageTitle}</h1>
          </div>
          <div className="topbar-actions">
            <button className="icon-button" title="通知">
              <Bell size={18} />
            </button>
            <button className="primary-button">
              <Send size={17} />
              関係者へ送信
            </button>
            <button className="secondary-button logout-button" onClick={onLogout} type="button">
              <LogOut size={16} />
              ログアウト
            </button>
          </div>
        </header>

        {activeWorkMenu === "adjustment" && (
          <>
          <section className="panel candidate-placement-panel" aria-label="未確定の打設計画">
            <div className="panel-heading compact">
              <div>
                <p className="eyebrow">調整対象</p>
                <h2>打設予定リスト</h2>
              </div>
              <span className="status-pill">{candidatePlacementList.length} 件</span>
            </div>
            <div className="candidate-placement-list">
              {candidatePlacementList.length === 0 && <p>未確定の打設予定はありません。</p>}
              {candidatePlacementList.map(({ row, activeSchedule, scheduleLabel, scheduleTone }) => (
                <article className="candidate-placement-card placement-plan-tile" key={row.id}>
                  <div>
                    <strong>
                      <em className={`placement-schedule-badge ${scheduleTone}`}>{scheduleLabel}</em>
                      {formatPlacementLocation(row)}
                    </strong>
                    <span>
                      {row.concreteVolume || "-"}m3 / {row.floorArea || "-"}m2
                    </span>
                  </div>
                  <dl className="placement-tile-popover">
                    <div><dt>状態</dt><dd>{activeSchedule ? scheduleStatusLabels[activeSchedule.status] : "未設定"}</dd></div>
                    <div><dt>配合</dt><dd>{row.mix || "未設定"}</dd></div>
                    <div><dt>床仕上げ</dt><dd>{row.floorFinish || "未設定"}</dd></div>
                    <div><dt>台数</dt><dd>{row.mixersPerHour || "-"} 台/h</dd></div>
                    <div><dt>配管</dt><dd>{row.hasPipe ? `${row.pipeLength || "-"} m` : "なし"}</dd></div>
                    <div><dt>2台付け</dt><dd>{row.doubleTruck}</dd></div>
                  </dl>
                </article>
              ))}
            </div>
          </section>
          </>
        )}

        {activeWorkMenu === "settings" && (
        <>
        <section className="panel work-calendar-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">稼働日設定</p>
              <h2>現場カレンダー</h2>
            </div>
          </div>
          <div className="work-calendar-settings">
            <div className="setting-block site-setting-block">
              <span>現場</span>
              <div className="site-setting-grid">
                <label>
                  郵便番号
                  <input
                    value={siteSettings.postalCode}
                    onChange={(event) => updateSiteSetting("postalCode", event.target.value)}
                  />
                </label>
                <label>
                  住所
                  <input
                    value={siteSettings.address}
                    onChange={(event) => updateSiteSetting("address", event.target.value)}
                  />
                </label>
                <label>
                  緯度
                  <input
                    value={siteSettings.latitude}
                    onChange={(event) => updateSiteSetting("latitude", event.target.value)}
                    inputMode="decimal"
                  />
                </label>
                <label>
                  経度
                  <input
                    value={siteSettings.longitude}
                    onChange={(event) => updateSiteSetting("longitude", event.target.value)}
                    inputMode="decimal"
                  />
                </label>
              </div>
              <small className={`weather-status ${weatherStatus}`}>
                天気予報: {weatherStatus === "loading" ? "取得中" : weatherStatus === "ready" ? "取得済み" : weatherStatus === "error" ? "取得失敗" : "未取得"}
              </small>
            </div>
            <div className="setting-block">
              <span>祝日</span>
              <div className="setting-segmented">
                <button
                  className={workCalendarSettings.holidayMode === "closed" ? "active" : ""}
                  onClick={() => setWorkCalendarSettings((current) => ({ ...current, holidayMode: "closed" }))}
                  type="button"
                >
                  休工
                </button>
                <button
                  className={workCalendarSettings.holidayMode === "work" ? "active" : ""}
                  onClick={() => setWorkCalendarSettings((current) => ({ ...current, holidayMode: "work" }))}
                  type="button"
                >
                  稼働
                </button>
              </div>
            </div>
            <div className="setting-block">
              <span>土曜休工</span>
              <div className="saturday-options">
                {saturdayWeekOptions.map((week) => (
                  <label key={week}>
                    <input
                      checked={workCalendarSettings.saturdayClosedWeeks.includes(week)}
                      onChange={() => toggleSaturdayClosedWeek(week)}
                      type="checkbox"
                    />
                    第{week}土曜
                  </label>
                ))}
              </div>
            </div>
          </div>
        </section>
        <section className="panel master-panel mix-master-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">配合マスタ</p>
              <h2>打設で使う配合</h2>
            </div>
            <button className="secondary-button" onClick={addMixMasterItem} type="button">
              <Plus size={16} />
              配合追加
            </button>
          </div>
          <div className="mix-master-list">
            {mixMaster.map((mix, index) => (
              <label className="mix-master-row" key={`${mix}-${index}`}>
                <span>配合 {index + 1}</span>
                <input value={mix} onChange={(event) => updateMixMasterItem(index, event.target.value)} />
                <button
                  aria-label={`${mix || `配合 ${index + 1}`}を削除`}
                  disabled={mixMaster.length <= 1}
                  onClick={() => removeMixMasterItem(index)}
                  title="削除"
                  type="button"
                >
                  <X size={16} />
                </button>
              </label>
            ))}
          </div>
        </section>
        <section className="panel master-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">関係者マスタ</p>
              <h2>今回の調整メンバー</h2>
            </div>
            <span className="status-pill">{activeMembers.length} 社参加中</span>
          </div>
          <div className="partner-master-table">
            <div className="partner-master-row partner-master-head">
              <div>工種</div>
              <div>協力会社名</div>
              <div>職長名</div>
              <div>アドレス</div>
              <div>エリア</div>
              <div>工区</div>
              <div>参加</div>
            </div>
            {visibleStakeholderMaster.map((member) => {
              const joined = activeMembers.some((activeMember) => activeMember.id === member.id);
              return (
                <button
                  className={`partner-master-row ${joined ? "joined" : ""}`}
                  key={member.id}
                  onClick={() => addMemberFromMaster(member)}
                  type="button"
                >
                  <strong>{member.trade}</strong>
                  <span>{member.company}</span>
                  <span>{member.foreman}</span>
                  <span>{member.email}</span>
                  <span>{member.area}</span>
                  <span>{member.zone}</span>
                  <em>{joined ? "参加中" : "追加"}</em>
                </button>
              );
            })}
          </div>
          <div className="zone-master">
            <div className="zone-master-heading">
              <div>
                <p className="eyebrow">工区別担当マスタ</p>
                <h3>工区ごとの協力会社</h3>
              </div>
            </div>
            <div className="zone-assignment-grid">
              <div
                className="zone-assignment-row zone-assignment-head"
                style={{ "--area-zone-count": areaZoneOptions.length } as CSSProperties}
              >
                <div>役割</div>
                {areaZoneOptions.map(({ area, zone }) => (
                  <div key={`${area}-${zone}`}>
                    <span>{area}</span>
                    <strong>{zone}</strong>
                  </div>
                ))}
              </div>
              {assignmentRoles.map((role) => (
                <div
                  className="zone-assignment-row"
                  key={role}
                  style={{ "--area-zone-count": areaZoneOptions.length } as CSSProperties}
                >
                  <strong>{role}</strong>
                  {areaZoneOptions.map(({ area, zone }) => (
                    <label className="assignment-select" key={`${role}-${area}-${zone}`}>
                      <span>{area} / {zone}</span>
                      <select
                        value={getAssignedMemberId(area, zone, role)}
                        onChange={(event) => updateZoneAssignment(area, zone, role, event.target.value)}
                      >
                        <option value="">未設定</option>
                        {visibleStakeholderMaster
                          .filter((member) => member.role === role)
                          .map((member) => (
                            <option key={member.id} value={member.id}>
                              {member.company}
                            </option>
                          ))}
                      </select>
                    </label>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>
        </>
        )}

        {activeWorkMenu === "quantity" && isConcreteEvent && (
          <>
          <section className="panel details-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">事前入力</p>
                <h2>打設数量・配合条件</h2>
              </div>
              <div className="detail-actions">
                <div className="view-toggle" aria-label="表示切替">
                  <button
                    type="button"
                    className={detailView === "table" ? "active" : ""}
                    onClick={() => setDetailView("table")}
                    title="テーブルビュー"
                  >
                    <Table2 size={16} />
                    表
                  </button>
                  <button
                    type="button"
                    className={detailView === "calendar" ? "active" : ""}
                    onClick={() => setDetailView("calendar")}
                    title="カレンダービュー"
                  >
                    <CalendarDays size={16} />
                    予定
                  </button>
                </div>
                {detailView === "calendar" && (
                  <div className="calendar-nav" aria-label="月送り">
                    <button onClick={() => setCalendarMonthOffset((current) => current - 1)} title="前月" type="button">
                      <ChevronLeft size={16} />
                    </button>
                    <span>
                      {placementMonths[0]?.label} - {placementMonths[1]?.label}
                    </span>
                    <button onClick={() => setCalendarMonthOffset((current) => current + 1)} title="翌月" type="button">
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
                {detailView === "table" && (
                  <button className="secondary-button" onClick={addPlacementRow} type="button">
                    <Plus size={16} />
                    予定追加
                  </button>
                )}
              </div>
            </div>

            {hasInvalidPlacementRows && (
              <div className="error-banner">
                未入力の必須項目があります。希望日、工区、階数、数量、床面積、配合、床仕上げを確認してください。
              </div>
            )}

            {detailView === "table" ? (
              <div className="placement-grid-wrap">
                <div className="placement-grid">
                  <div className="placement-grid-row placement-grid-head">
                    <div>希望日</div>
                    <div>工区</div>
                    <div>枝番</div>
                    <div>階数</div>
                    <div>数量 m3</div>
                    <div>床面積 m2</div>
                    <div>配合</div>
                    <div>台数 台/h</div>
                    <div>床仕上げ</div>
                    <div>配管</div>
                    <div>2台付け</div>
                    <div>操作</div>
                  </div>
                  {placementRows.map((row) => {
                    const isRowEditing = Boolean(editingPlacementRows[row.id]);
                    const showRowErrors = Boolean(invalidPlacementRows[row.id]);
                    const activeSchedule = getActiveSchedule(placementSchedules, row.id);
                    const scheduleLabel =
                      activeSchedule?.status === "confirmed"
                        ? `${formatDateKeyShort(activeSchedule.date)} ${activeSchedule.startTime ?? ""} ${scheduleStatusLabels[activeSchedule.status]}`.replace(/\s+/g, " ").trim()
                        : preferredCandidate
                          ? `${preferredCandidate.candidate.label.replace(/\s.+$/, "")} 未確定`
                          : "未確定";
                    const scheduleTone =
                      activeSchedule?.status === "confirmed"
                        ? "confirmed"
                        : preferredCandidate
                          ? getCandidateTone(preferredCandidate.score)
                          : "waiting";
                    return (
                    <div className={`placement-grid-row ${isRowEditing ? "is-editing" : "is-locked"}`} key={row.id}>
                      <div className="placement-row-summary placement-plan-tile">
                        <div>
                          <strong>
                            <em className={`placement-schedule-badge ${scheduleTone}`}>{scheduleLabel}</em>
                            {formatPlacementLocation(row)}
                          </strong>
                          <span>
                            {row.concreteVolume || "-"}m3 / {row.floorArea || "-"}m2
                          </span>
                        </div>
                        <dl className="placement-tile-popover">
                          <div><dt>配合</dt><dd>{row.mix || "未設定"}</dd></div>
                          <div><dt>床仕上げ</dt><dd>{row.floorFinish || "未設定"}</dd></div>
                          <div><dt>台数</dt><dd>{row.mixersPerHour || "-"} 台/h</dd></div>
                          <div><dt>配管</dt><dd>{row.hasPipe ? `${row.pipeLength || "-"} m` : "なし"}</dd></div>
                          <div><dt>2台付け</dt><dd>{row.doubleTruck}</dd></div>
                          <div><dt>開始時刻</dt><dd>{activeSchedule?.startTime || "未確定"}</dd></div>
                        </dl>
                        <div className="placement-tile-actions">
                          <button className="row-dummy-button" type="button">
                            ダミー
                          </button>
                          {activeSchedule?.status === "draft" && (
                            <button className="row-confirm-button" onClick={() => confirmPlacementSchedule(row.id)} type="button">
                              確定
                            </button>
                          )}
                          {activeSchedule?.status === "confirmed" && (
                            <button
                              className="row-reschedule-button"
                              onClick={() => setDetailView("calendar")}
                              type="button"
                            >
                              リスケ
                            </button>
                          )}
                          <button className="row-edit-button" onClick={() => togglePlacementRowEdit(row.id)} type="button">
                            {isRowEditing ? "完了" : "編集"}
                          </button>
                        </div>
                      </div>
                      <label className={`input-cell required schedule-date-cell ${showRowErrors && !activeSchedule?.date ? "error" : ""}`}>
                        <span>希望日</span>
                        <input
                          disabled={!isRowEditing || activeSchedule?.status === "confirmed"}
                          onChange={(event) => updatePlacementScheduleDate(row.id, event.target.value)}
                          type="date"
                          value={activeSchedule?.date ?? ""}
                        />
                      </label>
                      <label className={`input-cell required ${showRowErrors && isMissing(row.zone) ? "error" : ""}`}>
                        <span>工区</span>
                        <div className="select-shell">
                          <select
                            disabled={!isRowEditing}
                            value={row.zone}
                            onChange={(event) => updatePlacementRow(row.id, "zone", event.target.value)}
                          >
                            {Array.from(new Set([row.zone, ...zoneOptions])).map((zone) => (
                              <option key={zone}>{zone}</option>
                            ))}
                          </select>
                        </div>
                      </label>
                      <label className="input-cell branch-cell">
                        <span>枝番</span>
                        <input
                          disabled={!isRowEditing}
                          value={row.branchNumber}
                          onChange={(event) => updatePlacementRow(row.id, "branchNumber", event.target.value)}
                          inputMode="numeric"
                          placeholder="なし"
                        />
                      </label>
                      <label className={`input-cell required compact ${showRowErrors && isMissing(row.floor) ? "error" : ""}`}>
                        <span>階数</span>
                        <div className="select-shell">
                          <select
                            disabled={!isRowEditing}
                            value={row.floor}
                            onChange={(event) => updatePlacementRow(row.id, "floor", event.target.value)}
                          >
                            {floorOptions.map((floor) => (
                              <option key={floor}>{floor}</option>
                            ))}
                          </select>
                        </div>
                      </label>
                      <label className={`input-cell required ${showRowErrors && isMissing(row.concreteVolume) ? "error" : ""}`}>
                        <span>数量</span>
                        <div className="stepper">
                          <button
                            disabled={!isRowEditing}
                            onClick={() => stepPlacementNumber(row.id, "concreteVolume", -5)}
                            title="5減らす"
                            type="button"
                          >
                            <Minus size={14} />
                          </button>
                          <input
                            disabled={!isRowEditing}
                            value={row.concreteVolume}
                            onChange={(event) => updatePlacementRow(row.id, "concreteVolume", event.target.value)}
                            inputMode="numeric"
                          />
                          <button
                            disabled={!isRowEditing}
                            onClick={() => stepPlacementNumber(row.id, "concreteVolume", 5)}
                            title="5増やす"
                            type="button"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </label>
                      <label className={`input-cell required ${showRowErrors && isMissing(row.floorArea) ? "error" : ""}`}>
                        <span>床面積</span>
                        <div className="stepper">
                          <button
                            disabled={!isRowEditing}
                            onClick={() => stepPlacementNumber(row.id, "floorArea", -5)}
                            title="5減らす"
                            type="button"
                          >
                            <Minus size={14} />
                          </button>
                          <input
                            disabled={!isRowEditing}
                            value={row.floorArea}
                            onChange={(event) => updatePlacementRow(row.id, "floorArea", event.target.value)}
                            inputMode="numeric"
                          />
                          <button
                            disabled={!isRowEditing}
                            onClick={() => stepPlacementNumber(row.id, "floorArea", 5)}
                            title="5増やす"
                            type="button"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </label>
                      <label className={`input-cell required ${showRowErrors && isMissing(row.mix) ? "error" : ""}`}>
                        <span>配合</span>
                        <div className="select-shell">
                          <select
                            disabled={!isRowEditing}
                            value={row.mix}
                            onChange={(event) => updatePlacementRow(row.id, "mix", event.target.value)}
                          >
                            {Array.from(new Set([row.mix, ...mixOptions].filter(Boolean))).map((mix) => (
                              <option key={mix}>{mix}</option>
                            ))}
                          </select>
                        </div>
                      </label>
                      <label className="input-cell">
                        <span>台数/時</span>
                          <input
                            disabled={!isRowEditing}
                            value={row.mixersPerHour}
                            onChange={(event) => updatePlacementRow(row.id, "mixersPerHour", event.target.value)}
                            inputMode="numeric"
                          />
                      </label>
                      <label className={`input-cell required ${showRowErrors && isMissing(row.floorFinish) ? "error" : ""}`}>
                        <span>床仕上げ</span>
                        <div className="select-shell">
                          <select
                            disabled={!isRowEditing}
                            value={row.floorFinish}
                            onChange={(event) =>
                              updatePlacementRow(
                                row.id,
                                "floorFinish",
                                event.target.value as ConcretePlacementRow["floorFinish"]
                              )
                            }
                          >
                            {floorFinishOptions.map((finish) => (
                              <option key={finish}>{finish}</option>
                            ))}
                          </select>
                        </div>
                      </label>
                      <div className={`input-cell pipe-cell ${row.hasPipe ? "pipe-cell-active" : "pipe-cell-empty"}`}>
                        <label className="check-line">
                          <input
                            disabled={!isRowEditing}
                            checked={row.hasPipe}
                            onChange={(event) => {
                              updatePlacementRow(row.id, "hasPipe", event.target.checked);
                              if (!event.target.checked) updatePlacementRow(row.id, "pipeLength", "");
                            }}
                            type="checkbox"
                          />
                          配管あり
                        </label>
                        {row.hasPipe && (
                          <label className="pipe-length with-unit">
                            <span>配管長</span>
                          <input
                            disabled={!isRowEditing}
                            value={row.pipeLength}
                            onChange={(event) => updatePlacementRow(row.id, "pipeLength", event.target.value)}
                            inputMode="decimal"
                            placeholder="長さ"
                          />
                            <em>m</em>
                          </label>
                        )}
                      </div>
                      <label className="input-cell">
                        <span>2台付け</span>
                        <div className="select-shell">
                          <select
                            disabled={!isRowEditing}
                            value={row.doubleTruck}
                            onChange={(event) =>
                              updatePlacementRow(
                                row.id,
                                "doubleTruck",
                                event.target.value as ConcretePlacementRow["doubleTruck"]
                              )
                            }
                          >
                            <option>可</option>
                            <option>不可</option>
                          </select>
                        </div>
                      </label>
                      <div className="input-cell row-action-cell">
                        <button className="row-edit-button" onClick={() => togglePlacementRowEdit(row.id)} type="button">
                          {isRowEditing ? "完了" : "編集"}
                        </button>
                        {isRowEditing && (
                          <button className="row-delete-button" onClick={() => deletePlacementRow(row.id)} type="button">
                            削除
                          </button>
                        )}
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <>
              <section className="unscheduled-placement-panel" aria-label="未設定の打設予定">
                <div>
                  <p className="eyebrow">未設定の打設予定</p>
                  <h3>カレンダーへドラッグ</h3>
                </div>
                <div className="unscheduled-placement-list">
                  {unassignedPlacementRows.length === 0 && <p>未設定の打設予定はありません。</p>}
                  {unassignedPlacementRows.map((row) => (
                    <div
                      className="unscheduled-placement-card"
                      draggable
                      key={row.id}
                      onDragStart={(event) => event.dataTransfer.setData("text/plain", row.id)}
                    >
                      <strong>{formatPlacementLocation(row)}</strong>
                      <span>
                        {row.concreteVolume || "-"}m3 / {row.floorArea || "-"}m2
                      </span>
                    </div>
                  ))}
                </div>
              </section>
              <div className="monthly-calendar-board">
                {placementMonths.map((month) => (
                  <article className="monthly-calendar" key={month.key}>
                    <header>
                      <div>
                        <h3>{month.label}</h3>
                      </div>
                      <span>{month.itemCount} 件</span>
                    </header>
                    <div className="month-weekdays">
                      {weekdays.map((weekday) => (
                        <span key={weekday}>{weekday}</span>
                      ))}
                    </div>
                    <div className="month-grid">
                      {month.days.map((day) => (
                        <div
                          className={`month-cell ${day.inMonth ? "" : "muted"} ${day.holidayName ? "holiday" : ""} ${
                            day.closed ? "closed" : ""
                          }`}
                          key={day.key}
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={(event) => {
                            event.preventDefault();
                            const rowId = event.dataTransfer.getData("text/plain");
                            if (rowId) schedulePlacementRow(rowId, day.key);
                          }}
                        >
                          <div className="date-weather-line">
                            <strong>{day.dateLabel}</strong>
                            {day.weather && (
                              <span className="weather-chip" title={`${day.weather.label} ${formatWeatherTemp(day.weather)}`}>
                                {day.weather.label}
                                {day.weather.precipitationProbability !== null && (
                                  <em>{day.weather.precipitationProbability}%</em>
                                )}
                              </span>
                            )}
                          </div>
                          {day.holidayName && <em className="holiday-label">{day.holidayName}</em>}
                          {day.closed && <span className="closed-label">休工</span>}
                          <div className="month-cell-items">
                            {day.items.map(({ row, schedule }) => (
                              <div
                                className={`month-event ${schedule.status}`}
                                draggable={schedule.status === "draft"}
                                key={`${day.key}-${row.id}`}
                                onDragStart={(event) => {
                                  if (schedule.status === "draft") event.dataTransfer.setData("text/plain", row.id);
                                }}
                              >
                                <span>
                                  {formatPlacementLocation(row)}
                                  <em className="schedule-status">{scheduleStatusLabels[schedule.status]}</em>
                                </span>
                                <small>
                                  {row.concreteVolume || "-"}m3 / {row.floorArea || "-"}m2
                                </small>
                                {schedule.status === "confirmed" && schedule.startTime && (
                                  <em>{schedule.startTime} 開始</em>
                                )}
                                <div className="month-event-actions">
                                  {schedule.status === "draft" && (
                                    <button onClick={() => confirmPlacementSchedule(row.id)} type="button">
                                      確定
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
              {confirmedMovePrompt && (
                <div className="modal-backdrop" role="presentation">
                  <div className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="confirmed-move-title">
                    <p className="eyebrow">確定済み日程の変更</p>
                    <h2 id="confirmed-move-title">元の発注をキャンセルにしますか？</h2>
                    <p>
                      確定済みの日程を変更します。元の日程をキャンセル履歴として残し、同じ内容で新しい未確定レコードを作成します。
                    </p>
                    <dl>
                      <div>
                        <dt>元の日程</dt>
                        <dd>{confirmedMovePrompt.currentDate}</dd>
                      </div>
                      <div>
                        <dt>変更先</dt>
                        <dd>{confirmedMovePrompt.nextDate}</dd>
                      </div>
                    </dl>
                    <div className="modal-actions">
                      <button className="secondary-button" onClick={() => setConfirmedMovePrompt(null)} type="button">
                        戻る
                      </button>
                      <button className="secondary-button" onClick={moveConfirmedPlacementWithoutCancel} type="button">
                        日程だけ変更
                      </button>
                      <button className="primary-button" onClick={moveConfirmedPlacementWithCancel} type="button">
                        キャンセルして複製
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {confirmStartTimePrompt && confirmStartRow && confirmStartSchedule && (
                <div className="modal-backdrop" role="presentation">
                  <div className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-start-time-title">
                    <p className="eyebrow">確定処理</p>
                    <h2 id="confirm-start-time-title">打設開始時間を入力</h2>
                    <p>発注内容として保存するため、打設開始時間を入力してから確定します。</p>
                    <dl>
                      <div>
                        <dt>打設箇所</dt>
                        <dd>{formatPlacementLocation(confirmStartRow)}</dd>
                      </div>
                      <div>
                        <dt>日程</dt>
                        <dd>{formatDateKeyShort(confirmStartSchedule.date)}</dd>
                      </div>
                    </dl>
                    <label className="confirm-time-field">
                      開始時間
                      <input
                        autoFocus
                        onChange={(event) =>
                          setConfirmStartTimePrompt((current) =>
                            current ? { ...current, startTime: event.target.value } : current
                          )
                        }
                        type="time"
                        value={confirmStartTimePrompt.startTime}
                      />
                    </label>
                    <div className="modal-actions">
                      <button className="secondary-button" onClick={() => setConfirmStartTimePrompt(null)} type="button">
                        戻る
                      </button>
                      <button
                        className="primary-button danger-button"
                        disabled={!confirmStartTimePrompt.startTime.trim()}
                        onClick={finalizePlacementConfirmation}
                        type="button"
                      >
                        確定する
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {draftMovePrompt && (
                <div className="modal-backdrop" role="presentation">
                  <div className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="draft-move-title">
                    <p className="eyebrow">未確定日程の移動</p>
                    <h2 id="draft-move-title">この日程で確定しますか？</h2>
                    <p>未確定の打設予定を移動しました。移動先の日程で確定するか、未確定のまま調整を続けるか選択してください。</p>
                    <dl>
                      <div>
                        <dt>移動先</dt>
                        <dd>{draftMovePrompt.date}</dd>
                      </div>
                    </dl>
                    <div className="modal-actions">
                      <button className="secondary-button" onClick={() => setDraftMovePrompt(null)} type="button">
                        未確定のまま
                      </button>
                      <button className="primary-button danger-button" onClick={confirmDraftMoveSchedule} type="button">
                        確定する
                      </button>
                    </div>
                  </div>
                </div>
              )}
              </>
            )}
          </section>
          {detailView === "table" && confirmStartTimePrompt && confirmStartRow && confirmStartSchedule && (
            <div className="modal-backdrop" role="presentation">
              <div className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-start-time-table-title">
                <p className="eyebrow">確定処理</p>
                <h2 id="confirm-start-time-table-title">打設開始時間を入力</h2>
                <p>発注内容として保存するため、打設開始時間を入力してから確定します。</p>
                <dl>
                  <div>
                    <dt>打設箇所</dt>
                    <dd>{formatPlacementLocation(confirmStartRow)}</dd>
                  </div>
                  <div>
                    <dt>日程</dt>
                    <dd>{formatDateKeyShort(confirmStartSchedule.date)}</dd>
                  </div>
                </dl>
                <label className="confirm-time-field">
                  開始時間
                  <input
                    autoFocus
                    onChange={(event) =>
                      setConfirmStartTimePrompt((current) =>
                        current ? { ...current, startTime: event.target.value } : current
                      )
                    }
                    type="time"
                    value={confirmStartTimePrompt.startTime}
                  />
                </label>
                <div className="modal-actions">
                  <button className="secondary-button" onClick={() => setConfirmStartTimePrompt(null)} type="button">
                    戻る
                  </button>
                  <button
                    className="primary-button danger-button"
                    disabled={!confirmStartTimePrompt.startTime.trim()}
                    onClick={finalizePlacementConfirmation}
                    type="button"
                  >
                    確定する
                  </button>
                </div>
              </div>
            </div>
          )}
          </>
        )}

        {activeWorkMenu === "adjustment" && (
        <>
        <section className="content-grid">
          <div className="panel schedule-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">相互情報確認</p>
                <h2>候補日ごとの可否</h2>
              </div>
              <span className="status-pill">{activeEvent.status}</span>
            </div>

            <div className="matrix" role="table" aria-label="候補日ごとの回答表">
              <div className="matrix-row matrix-head" role="row" style={matrixColumns(activeEvent)}>
                <div role="columnheader">関係者</div>
                {activeEvent.candidates.map((candidate) => (
                  <div role="columnheader" key={candidate.id}>
                    <strong>{candidate.label}</strong>
                    <span>{candidate.time}</span>
                  </div>
                ))}
              </div>

              {activeMembers.map((member) => (
                <div className="matrix-row" role="row" key={member.id} style={matrixColumns(activeEvent)}>
                  <button
                    className={`member-cell ${member.id === selectedMember ? "selected" : ""}`}
                    onClick={() => setSelectedMember(member.id)}
                  >
                    <strong>{member.company}</strong>
                    <span>{member.role}</span>
                  </button>
                  {activeEvent.candidates.map((candidate) => {
                    const mark = responseEvent.responses[member.id]?.[candidate.id] ?? "none";
                    return (
                      <div className="mark-cell" role="cell" key={candidate.id}>
                        <div className="mark-choice" aria-label={`${member.company} ${candidate.label} の回答`}>
                          {(["ok", "maybe", "ng"] as Mark[]).map((choice) => (
                            <button
                              className={`mark mark-${choice} ${mark === choice ? "active" : ""}`}
                              key={choice}
                              onClick={() => updateMemberMark(member.id, candidate.id, choice)}
                              title={markText[choice]}
                              type="button"
                            >
                              {markLabels[choice]}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}

              <div className="matrix-row score-row" role="row" style={matrixColumns(activeEvent)}>
                <div role="cell">集計</div>
                {activeEvent.candidates.map((candidate) => {
                  const score = scoreCandidate(responseEvent, candidate.id);
                  return (
                    <div className={`score ${getCandidateTone(score)}`} role="cell" key={candidate.id}>
                      <strong>{score.ok}/{score.total}</strong>
                      <span>△{score.maybe} ×{score.ng} 未{score.none}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="adjustment-response-db">
              <div>
                <p className="eyebrow">調整さん回答DB</p>
                <h3>打設予定別の回答ログ</h3>
              </div>
              <div className="placement-response-log-list">
                {candidatePlacementList.length === 0 && <p>打設予定はありません。</p>}
                {candidatePlacementList.map(({ row, activeSchedule, scheduleLabel, scheduleTone }) => (
                  <details className="placement-response-log" key={row.id}>
                    <summary>
                      <span>
                        <em className={`placement-schedule-badge ${scheduleTone}`}>{scheduleLabel}</em>
                        <strong>{formatPlacementLocation(row)}</strong>
                      </span>
                      <small>
                        {row.concreteVolume || "-"}m3 / {row.floorArea || "-"}m2
                        {activeSchedule ? ` / ${scheduleStatusLabels[activeSchedule.status]}` : ""}
                      </small>
                    </summary>
                    <div className="adjustment-response-table" role="table" aria-label={`${formatPlacementLocation(row)} の調整さん回答ログ`}>
                      <div className="adjustment-response-row adjustment-response-head" role="row">
                        <div role="columnheader">カウント</div>
                        <div role="columnheader">希望日</div>
                        <div role="columnheader">業者</div>
                        <div role="columnheader">記号</div>
                      </div>
                      {adjustmentResponseRows.map((responseRow) => (
                        <div className="adjustment-response-row" role="row" key={`${row.id}-${responseRow.candidateId}-${responseRow.memberId}`}>
                          <span>{responseRow.count}</span>
                          <span>
                            {responseRow.candidateLabel}
                            <small>{responseRow.candidateTime}</small>
                          </span>
                          <strong>{responseRow.company}</strong>
                          <em className={`mark mark-${responseRow.mark}`} title={markText[responseRow.mark]}>
                            {markLabels[responseRow.mark]}
                          </em>
                        </div>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          </div>

          <aside className="panel response-panel">
            <div className="panel-heading compact">
              <div>
                <p className="eyebrow">回答入力</p>
                <h2>{selectedMemberInfo.company}</h2>
              </div>
              <Mail size={18} />
            </div>

            <div className="contact-line">
              <span>{selectedMemberInfo.role}</span>
              <span>{selectedMemberInfo.contact}</span>
            </div>

            <div className="response-list">
              {activeEvent.candidates.map((candidate) => {
                const current = responseEvent.responses[selectedMemberInfo.id]?.[candidate.id] ?? "none";
                return (
                  <div className="response-card" key={candidate.id}>
                    <div>
                      <strong>{candidate.label}</strong>
                      <span>{candidate.time}</span>
                      <small>{candidate.note}</small>
                    </div>
                    <div className="segmented" aria-label={`${candidate.label} の回答`}>
                      {(["ok", "maybe", "ng"] as Mark[]).map((mark) => (
                        <button
                          className={current === mark ? "active" : ""}
                          key={mark}
                          onClick={() => updateMark(candidate.id, mark)}
                          title={markText[mark]}
                        >
                          {markLabels[mark]}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>
        </section>

        </>
        )}
      </main>
    </div>
  );
}

function matrixColumns(event: EventItem) {
  return {
    gridTemplateColumns: `180px repeat(${event.candidates.length}, minmax(132px, 1fr))`,
  };
}

function buildPlacementMonths(
  event: EventItem,
  rows: ConcretePlacementRow[],
  placementSchedules: Record<string, PlacementSchedule>,
  monthOffset: number,
  settings: WorkCalendarSettings,
  weatherForecasts: Record<string, WeatherForecastDay>
) {
  const year = Number(event.due.slice(0, 4)) || 2026;
  const datedRows = Object.values(placementSchedules).flatMap((schedule) => {
    const row = rows.find((placementRow) => placementRow.id === schedule.rowId);
    const dateKey = schedule.date;
    const date = parseDateKey(dateKey);
    return row && date ? [{ row, schedule, date, key: dateKey }] : [];
  });
  const baseDate = datedRows[0]?.date ?? new Date(year, 5, 1);

  return [0, 1].map((offset) => {
    const monthDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + monthOffset + offset, 1);
    const monthKey = `${monthDate.getFullYear()}-${monthDate.getMonth()}`;
    const monthItems = datedRows.filter(
      (item) => item.date.getFullYear() === monthDate.getFullYear() && item.date.getMonth() === monthDate.getMonth()
    );
    return {
      key: monthKey,
      label: `${monthDate.getFullYear()}年${monthDate.getMonth() + 1}月`,
      itemCount: monthItems.filter((item) => item.schedule.status !== "canceled").length,
      days: buildMonthDays(monthDate, datedRows, settings, weatherForecasts),
    };
  });
}

function buildMonthDays(
  monthDate: Date,
  datedRows: { row: ConcretePlacementRow; schedule: PlacementSchedule; date: Date; key: string }[],
  settings: WorkCalendarSettings,
  weatherForecasts: Record<string, WeatherForecastDay>
) {
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const key = formatDateKey(date);
    const holidayName = japaneseHolidays[key] ?? "";
    const saturdayWeek = getSaturdayWeekOfMonth(date);
    const saturdayClosed = date.getDay() === 6 && settings.saturdayClosedWeeks.includes(saturdayWeek);
    const holidayClosed = Boolean(holidayName) && settings.holidayMode === "closed";
    return {
      key,
      dateLabel: String(date.getDate()),
      inMonth: date.getMonth() === monthDate.getMonth(),
      holidayName,
      closed: saturdayClosed || holidayClosed,
      weather: weatherForecasts[key],
      items: datedRows.filter((item) => item.key === key),
    };
  });
}

function parseWeatherForecasts(data: any): Record<string, WeatherForecastDay> {
  const daily = data?.daily;
  const dates: string[] = Array.isArray(daily?.time) ? daily.time : [];
  return Object.fromEntries(
    dates.map((date, index) => {
      const code = Number(daily.weather_code?.[index] ?? -1);
      const forecast: WeatherForecastDay = {
        date,
        code,
        label: weatherCodeLabels[code] ?? "天気",
        temperatureMax: toNullableNumber(daily.temperature_2m_max?.[index]),
        temperatureMin: toNullableNumber(daily.temperature_2m_min?.[index]),
        precipitationProbability: toNullableNumber(daily.precipitation_probability_max?.[index]),
      };
      return [date, forecast];
    })
  );
}

function toNullableNumber(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function formatWeatherTemp(weather: WeatherForecastDay) {
  if (weather.temperatureMax === null || weather.temperatureMin === null) return "";
  return `${Math.round(weather.temperatureMin)}-${Math.round(weather.temperatureMax)}℃`;
}

function getActiveSchedule(schedules: Record<string, PlacementSchedule>, rowId: string) {
  const schedule = schedules[rowId];
  return schedule?.status === "canceled" ? undefined : schedule;
}

function getNowLabel() {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}/${pad(now.getMonth() + 1)}/${pad(now.getDate())} ${pad(now.getHours())}:${pad(
    now.getMinutes()
  )}`;
}

function formatShortDateTime(value: string) {
  return value.replace(/^\d{4}\//, "");
}

function formatDateKeyShort(dateKey: string) {
  const date = parseDateKey(dateKey);
  if (!date) return dateKey;
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function getDefaultPlacementStartTime(dateKey: string, event: EventItem) {
  const shortDate = formatDateKeyShort(dateKey);
  const candidate = event.candidates.find((item) => item.label.startsWith(shortDate));
  const start = candidate?.time.match(/^(\d{1,2}):(\d{2})/)?.slice(1, 3);
  if (!start) return "08:00";
  return `${start[0].padStart(2, "0")}:${start[1]}`;
}

function getAreaZoneOptions(
  members: StakeholderMaster[],
  assignments: ZoneAssignment[],
  roles: string[]
) {
  const pairs = new Map<string, { area: string; zone: string }>();
  for (const member of members) {
    pairs.set(`${member.area}__${member.zone}`, { area: member.area, zone: member.zone });
  }
  for (const assignment of assignments) {
    if (roles.includes(assignment.role)) {
      pairs.set(`${assignment.area}__${assignment.zone}`, { area: assignment.area, zone: assignment.zone });
    }
  }
  return Array.from(pairs.values());
}

function getSaturdayWeekOfMonth(date: Date) {
  return Math.floor((date.getDate() - 1) / 7) + 1;
}

function parseDateKey(dateKey: string | undefined) {
  const match = dateKey?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function formatDateKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function MixerTruckIcon() {
  return (
    <svg aria-hidden="true" className="mixer-truck-icon" fill="none" viewBox="0 0 40 28">
      <path d="M3 17.5V12c0-4.2 2.7-7.6 6.2-7.6h6.4v13.1" />
      <path d="M5 17.5h29.5" />
      <path d="M15.6 12.3h3.3l1.2 5.2" />
      <path d="M20.1 7.9c3.5-3 6.6-3.1 12.2-.9l3.4 2.3-1.3 7.2c-3 2.4-6.2 3.5-11.2 3.1z" />
      <path d="M25.7 5.8 29 18.8" />
      <path d="M35.7 9.3h3.1l-1.2 4.7h-3.3" />
      <path d="M34.3 14h3.1c-.5 1.4-1.3 2.6-2.6 3.5" />
      <path d="M4.2 17.5v3.2h31.9v-3.2" />
      <path d="M3.1 15.2H2.3c-.7 0-1.2.8-1.2 1.8s.5 1.8 1.2 1.8h.8" />
      <path d="M8.1 9.1h2.5l-1.8 4.5H6.3z" />
      <path d="M12.5 9.1h2.6v4.5h-4z" />
      <circle cx="9.8" cy="22" r="3.1" />
      <circle cx="25.7" cy="22" r="3.1" />
      <circle cx="32.4" cy="22" r="3.1" />
      <circle cx="9.8" cy="22" r="1.1" />
      <circle cx="25.7" cy="22" r="1.1" />
      <circle cx="32.4" cy="22" r="1.1" />
    </svg>
  );
}

function UnicTruckIcon() {
  return (
    <svg aria-hidden="true" className="unic-truck-icon" fill="none" viewBox="0 0 40 28">
      <path d="M4.2 17.5h5.1" />
      <path d="M9.3 17.5v-5.7h4l1.7 5.7" />
      <path d="M10.4 13h2.1l.7 2.5-2.8.5z" />
      <path d="M16.7 16.5h17.5v3.4H16.7z" />
      <path d="M20.1 13.2h13v3.3h-13z" />
      <path d="M19 7.9 30.6 13.8" />
      <path d="M10.8 3.9 19 8.5" />
      <path d="M6.4 3h4.4v3.8H6.4z" />
      <path d="M7.5 6.8v5.1" />
      <path d="M8.8 6.8v5.1" />
      <path d="M8.2 11.9v3.1" />
      <path d="M7.3 15c0 1 .8 1.8 1.8 1.8s1.8-.8 1.8-1.8" />
      <path d="M5.4 17.5v3.1h30v-3.1" />
      <circle cx="13" cy="21.8" r="2.6" />
      <circle cx="32" cy="21.8" r="2.6" />
      <circle cx="13" cy="21.8" r="1" />
      <circle cx="32" cy="21.8" r="1" />
    </svg>
  );
}

function formatPlacementLocation(row: ConcretePlacementRow) {
  const branch = row.branchNumber.trim() ? `-${row.branchNumber.trim()}` : "";
  return `${row.zone}${branch} ${row.floor}`;
}

function getZoneOptions(count: number, notation: ZoneNotation) {
  const circled = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩"];
  return Array.from({ length: count }, (_, index) => {
    if (notation === "alphabet") return `${String.fromCharCode(65 + index)}工区`;
    if (notation === "circled") return `${circled[index] ?? index + 1}工区`;
    return `${index + 1}工区`;
  });
}

function isMissing(value: string) {
  return !value.trim();
}

function isPlacementPlanIncomplete(row: ConcretePlacementRow, schedule?: PlacementSchedule) {
  return [schedule?.date ?? "", row.zone, row.floor, row.concreteVolume, row.floorArea, row.mix, row.floorFinish].some(isMissing);
}
