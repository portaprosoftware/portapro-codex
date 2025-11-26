declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
  interface IntrinsicAttributes {
    key?: any;
  }
}

declare module 'react' {
  export class Component<P = any, S = any> {
    constructor(props: P);
    props: P;
    state: S;
    setState(state: Partial<S>): void;
    forceUpdate(): void;
  }
  export class PureComponent<P = any, S = any> extends Component<P, S> {}

  export as namespace React;

  export type ReactNode = any;
  export type FC<P = {}> = (props: P & { children?: ReactNode }) => ReactNode;
  export type PropsWithChildren<P = {}> = P & { children?: ReactNode };
  export type ComponentType<P = {}> = (props: P) => ReactNode;
  export type Ref<T = any> = { current: T } | ((instance: T | null) => void) | null;
  export type ComponentPropsWithoutRef<T> = any;
  export type ComponentProps<T> = any;
  export type ElementRef<T> = any;
  export type Dispatch<A> = (value: A) => void;
  export type Reducer<S, A> = (state: S, action: A) => S;
  export type HTMLAttributes<T> = { children?: ReactNode; [key: string]: any };
  export type ThHTMLAttributes<T> = HTMLAttributes<T>;
  export type TdHTMLAttributes<T> = HTMLAttributes<T>;
  export type TextareaHTMLAttributes<T> = HTMLAttributes<T>;
  export type DetailedHTMLProps<E, T> = any;
  export interface CSSProperties {
    [key: string]: any;
  }
  export type ChangeEvent<T = any> = any;
  export type FormEvent<T = any> = any;
  export type DragEvent<T = any> = any;
  export type KeyboardEvent<T = any> = any;
  export type MouseEvent<T = any> = any;
  export type TouchEvent<T = any> = any;
  export type ReactElement = any;

  export function createElement(type: any, props: any, ...children: any[]): ReactElement;
  export function forwardRef<T, P = {}>(render: (props: P, ref: Ref<T>) => ReactNode): any;
  export function memo<T>(component: T): T;
  export function lazy(factory: any): any;
  export const Suspense: any;
  export const StrictMode: any;

  export function useState<T>(initial: T | (() => T)): [T, (value: T | ((prev: T) => T)) => void];
  export function useEffect(effect: () => void | (() => void), deps?: any[]): void;
  export function useMemo<T>(factory: () => T, deps: any[]): T;
  export function useCallback<T extends (...args: any[]) => any>(fn: T, deps: any[]): T;
  export function useRef<T>(value: T): { current: T };
  export function useReducer<S, A>(reducer: Reducer<S, A>, initialState: S): [S, Dispatch<A>];
  export function useContext<T>(context: any): T;
  export function createContext<T>(defaultValue: T): any;
  export function useId(): string;
}

declare module 'react/jsx-runtime' {
  export const jsx: any;
  export const jsxs: any;
  export const Fragment: any;
}

declare module 'react-dom' {
  export const createPortal: any;
}

declare module 'vitest' {
  export const describe: (...args: any[]) => void;
  export const it: (...args: any[]) => void;
  export const test: (...args: any[]) => void;
  export const expect: any;
  export const beforeAll: (...args: any[]) => void;
  export const afterAll: (...args: any[]) => void;
  export const beforeEach: (...args: any[]) => void;
  export const afterEach: (...args: any[]) => void;
  export const vi: any;
}

declare module '@supabase/supabase-js' {
  export type PostgrestFilterBuilder<T = any> = any;
  export type SupabaseClient<Database = any> = any;
  export function createClient<Database = any>(url: string, key: string, options?: any): SupabaseClient<Database>;
}

declare module '@supabase/postgrest-js' {
  export type PostgrestFilterBuilder<T = any> = any;
}

declare module '@huggingface/transformers' {
  export const pipeline: any;
  export const env: any;
}

declare module 'date-fns' {
  export function format(date: Date | number, formatStr: string, options?: any): string;
  export function formatDistanceToNow(date: Date | number, options?: any): string;
  export const addDays: any;
  export const subDays: any;
  export const startOfMonth: any;
  export const endOfMonth: any;
  export const subMonths: any;
  export const eachDayOfInterval: any;
  export const differenceInDays: any;
  export const parseISO: any;
  export const startOfDay: any;
  export const isSameDay: any;
  export const addMonths: any;
  export const startOfWeek: any;
  export const endOfWeek: any;
  export const addWeeks: any;
  export const subWeeks: any;
  export const startOfQuarter: any;
  export const startOfYear: any;
  export const subYears: any;
  export const isToday: any;
  export const endOfDay: any;
  export const differenceInHours: any;
}

declare module 'date-fns-tz' {
  export function utcToZonedTime(date: Date | number, timeZone: string): Date;
  export function toZonedTime(date: Date | number, timeZone: string): Date;
  export function formatInTimeZone(date: Date | number, timeZone: string, formatStr: string, options?: any): string;
  export const format: any;
}

declare module 'idb' {
  export interface IDBPDatabase<DBTypes = any> {}
  export type DBSchema = any;
  export function openDB<DBTypes = any>(name: string, version?: number, options?: any): IDBPDatabase<DBTypes>;
}

declare module 'react-day-picker' {
  export type DateRange = { from?: Date; to?: Date };
  export const DayPicker: any;
}

declare module 'vite' {
  export interface UserConfig {
    [key: string]: any;
  }
  export function defineConfig(config: UserConfig): UserConfig;
}

declare module '@vitejs/plugin-react-swc' {
  const plugin: any;
  export default plugin;
}

declare module 'vite-plugin-pwa' {
  export const VitePWA: any;
}

declare module 'lovable-tagger' {
  const plugin: any;
  export default plugin;
  export const componentTagger: any;
}

declare module '@radix-ui/react-separator'
declare module '@radix-ui/react-dialog'
declare module '@radix-ui/react-checkbox'
declare module '@radix-ui/react-select'
declare module '@radix-ui/react-dropdown-menu'
declare module '@radix-ui/react-popover'
declare module '@radix-ui/react-scroll-area'
declare module '@radix-ui/react-label'
declare module '@radix-ui/react-navigation-menu'
declare module '@radix-ui/react-progress'
declare module '@radix-ui/react-avatar'
declare module '@radix-ui/react-collapsible'
declare module '@radix-ui/react-accordion'
declare module '@radix-ui/react-slot'
declare module '@radix-ui/react-toast'
declare module '@radix-ui/react-tooltip'
declare module '@radix-ui/react-switch'
declare module '@radix-ui/react-slider'
declare module '@radix-ui/react-aspect-ratio'
declare module '@radix-ui/react-tabs'
declare module '@radix-ui/react-menubar'
declare module '@radix-ui/react-hover-card'
declare module '@radix-ui/react-context-menu'
declare module '@radix-ui/react-toggle'
declare module '@radix-ui/react-toggle-group'

declare module '@clerk/clerk-react'

declare module '@tanstack/react-query' {
  export function useQuery<TData = any>(options: any): any;
  export function useMutation<TData = any>(options: any): any;
  export function useQueryClient(): any;
  export function QueryClient(): any;
  export const QueryClientProvider: any;
  export const keepPreviousData: any;
}

declare module 'react-router-dom'
declare module 'sonner'

declare module 'class-variance-authority' {
  export type ClassValue = any;
  export function cva(...args: any[]): any;
  export type VariantProps<T> = any;
}

declare module 'next-themes'

declare module 'next' {
  export type NextApiRequest = any;
  export type NextApiResponse<T = any> = any;
}

declare module 'zod' {
  export const z: any;
  export type ZodTypeAny = any;
  export type infer<T> = any;
  export function object(shape: any): any;
  export function string(): any;
  export function number(): any;
  export function boolean(): any;
  export function array(schema: any): any;
  export function union(args: any): any;
  export function literal(value: any): any;
  export function nullable(schema: any): any;
  export function optional(schema: any): any;
  export default z;
}

declare module 'lucide-react' {
  export const createLucideIcon: any;
  export type Icon = any;
  export type IconNode = any;
  export type LucideIcon = any;
  export type LucideProps = any;
  export const icons: Record<string, any>;
  const defaultExport: any;
  export default defaultExport;
  export const Activity: any;
  export const AlertCircle: any;
  export const AlertOctagon: any;
  export const AlertTriangle: any;
  export const AlignLeft: any;
  export const Archive: any;
  export const ArrowDown: any;
  export const ArrowDownRight: any;
  export const ArrowLeft: any;
  export const ArrowLeftRight: any;
  export const ArrowRight: any;
  export const ArrowRightLeft: any;
  export const ArrowUp: any;
  export const ArrowUpDown: any;
  export const ArrowUpRight: any;
  export const Award: any;
  export const Ban: any;
  export const BanknoteIcon: any;
  export const BarChart: any;
  export const BarChart3: any;
  export const BarChart4: any;
  export const Barcode: any;
  export const Bath: any;
  export const Battery: any;
  export const Bell: any;
  export const BellOff: any;
  export const BellRing: any;
  export const Bolt: any;
  export const Book: any;
  export const BookOpen: any;
  export const Bookmark: any;
  export const BookmarkPlus: any;
  export const Bot: any;
  export const Box: any;
  export const Boxes: any;
  export const Brain: any;
  export const Briefcase: any;
  export const BriefcaseIcon: any;
  export const Building: any;
  export const Building2: any;
  export const Cake: any;
  export const Calculator: any;
  export const Calendar: any;
  export const CalendarCheck: any;
  export const CalendarClock: any;
  export const CalendarDays: any;
  export const CalendarIcon: any;
  export const CalendarOff: any;
  export const Camera: any;
  export const Car: any;
  export const Check: any;
  export const CheckCheck: any;
  export const CheckCircle: any;
  export const CheckCircle2: any;
  export const CheckSquare: any;
  export const ChevronDown: any;
  export const ChevronLeft: any;
  export const ChevronRight: any;
  export const ChevronUp: any;
  export const ChevronsUpDown: any;
  export const Chrome: any;
  export const Circle: any;
  export const CircleDollarSign: any;
  export const Clipboard: any;
  export const ClipboardCheck: any;
  export const ClipboardClock: any;
  export const ClipboardList: any;
  export const Clock: any;
  export const Cloud: any;
  export const CloudDrizzle: any;
  export const CloudFog: any;
  export const CloudLightning: any;
  export const CloudOff: any;
  export const CloudRain: any;
  export const CloudUpload: any;
  export const Compass: any;
  export const Container: any;
  export const Copy: any;
  export const CreditCard: any;
  export const Crosshair: any;
  export const Crown: any;
  export const Database: any;
  export const DollarSign: any;
  export const DollarSignIcon: any;
  export const Dot: any;
  export const Download: any;
  export const Droplet: any;
  export const Droplets: any;
  export const Edit: any;
  export const Edit2: any;
  export const Edit3: any;
  export const ExternalLink: any;
  export const Eye: any;
  export const EyeOff: any;
  export const Factory: any;
  export const File: any;
  export const FileCog: any;
  export const FileDigit: any;
  export const FileDown: any;
  export const FileIcon: any;
  export const FileSignature: any;
  export const FileSpreadsheet: any;
  export const FileStack: any;
  export const FileText: any;
  export const FileTextIcon: any;
  export const FileWarning: any;
  export const FileX: any;
  export const Filter: any;
  export const Flag: any;
  export const Flame: any;
  export const Flashlight: any;
  export const FlaskConical: any;
  export const Focus: any;
  export const FolderOpen: any;
  export const Frown: any;
  export const Fuel: any;
  export const FuelIcon: any;
  export const Gauge: any;
  export const GitBranch: any;
  export const Globe: any;
  export const GraduationCap: any;
  export const Grid: any;
  export const Grid3X3: any;
  export const Grid3x3: any;
  export const Hammer: any;
  export const HardHat: any;
  export const Headphones: any;
  export const HeartPulse: any;
  export const HelpingHand: any;
  export const History: any;
  export const Home: any;
  export const Hospital: any;
  export const IdCard: any;
  export const Image: any;
  export const Inbox: any;
  export const Info: any;
  export const Key: any;
  export const Landmark: any;
  export const Layers: any;
  export const LayoutDashboard: any;
  export const Leaf: any;
  export const Lightbulb: any;
  export const LineChart: any;
  export const Link: any;
  export const List: any;
  export const Loader2: any;
  export const Lock: any;
  export const LogOut: any;
  export const Mail: any;
  export const MailPlus: any;
  export const Map: any;
  export const MapPin: any;
  export const Maximize: any;
  export const Maximize2: any;
  export const Megaphone: any;
  export const Menu: any;
  export const MessageCircle: any;
  export const MessageSquare: any;
  export const MessageSquareText: any;
  export const Mic: any;
  export const MicOff: any;
  export const Minimize2: any;
  export const Minus: any;
  export const MinusCircle: any;
  export const Monitor: any;
  export const MonitorSmartphone: any;
  export const MoreHorizontal: any;
  export const MoreVertical: any;
  export const MousePointer: any;
  export const Move: any;
  export const MoveRight: any;
  export const Navigation: any;
  export const Package: any;
  export const PackageCheck: any;
  export const Palette: any;
  export const Paperclip: any;
  export const Pause: any;
  export const PauseCircle: any;
  export const PenTool: any;
  export const Pencil: any;
  export const Percent: any;
  export const Phone: any;
  export const PieChart: any;
  export const PiggyBank: any;
  export const Play: any;
  export const PlayCircle: any;
  export const Plus: any;
  export const PlusCircle: any;
  export const Printer: any;
  export const QrCode: any;
  export const Radar: any;
  export const Receipt: any;
  export const Recycle: any;
  export const RefreshCcw: any;
  export const RefreshCw: any;
  export const RotateCcw: any;
  export const RotateCw: any;
  export const Route: any;
  export const Satellite: any;
  export const Save: any;
  export const Scan: any;
  export const ScanLine: any;
  export const Search: any;
  export const Send: any;
  export const Server: any;
  export const Settings: any;
  export const Settings2: any;
  export const Share2: any;
  export const Shield: any;
  export const ShieldAlert: any;
  export const ShieldCheck: any;
  export const ShoppingBag: any;
  export const ShoppingCart: any;
  export const Signature: any;
  export const Siren: any;
  export const Sliders: any;
  export const Smartphone: any;
  export const Smile: any;
  export const Snowflake: any;
  export const SoapDispenserDroplet: any;
  export const Sparkles: any;
  export const Square: any;
  export const SquarePen: any;
  export const Star: any;
  export const StickyNote: any;
  export const Sun: any;
  export const Table: any;
  export const Tablet: any;
  export const Tag: any;
  export const Target: any;
  export const TestTube: any;
  export const Thermometer: any;
  export const ThermometerSnowflake: any;
  export const ThermometerSun: any;
  export const Timer: any;
  export const ToggleLeft: any;
  export const ToggleRight: any;
  export const Toilet: any;
  export const Trash: any;
  export const Trash2: any;
  export const TrendingDown: any;
  export const TrendingUp: any;
  export const Trophy: any;
  export const Truck: any;
  export const TruckIcon: any;
  export const Type: any;
  export const Undo2: any;
  export const Upload: any;
  export const User: any;
  export const UserCheck: any;
  export const UserCog: any;
  export const UserIcon: any;
  export const UserPlus: any;
  export const UserX: any;
  export const Users: any;
  export const Users2: any;
  export const Utensils: any;
  export const Vibrate: any;
  export const Video: any;
  export const Wallet: any;
  export const WalletMinimal: any;
  export const Wand2: any;
  export const Warehouse: any;
  export const Waves: any;
  export const Wifi: any;
  export const WifiOff: any;
  export const Wind: any;
  export const Wrench: any;
  export const WrenchIcon: any;
  export const X: any;
  export const XCircle: any;
  export const Zap: any;
  export const ZoomIn: any;
  export const ZoomOut: any;
}

declare module 'fs' {
  export const readFileSync: any;
  export const writeFileSync: any;
  export const existsSync: any;
  export const mkdirSync: any;
  export const readdirSync: any;
  export const statSync: any;
}

declare module 'path' {
  export const join: (...args: any[]) => string;
  export const resolve: (...args: any[]) => string;
  export const dirname: (...args: any[]) => string;
  export const extname: (...args: any[]) => string;
}

declare module 'react-beautiful-dnd' {
  export type DropResult = any;
  export const DragDropContext: any;
  export const Droppable: any;
  export const Draggable: any;
}

declare module 'react-signature-canvas' {
  const SignatureCanvas: any;
  export default SignatureCanvas;
}

declare module 'mapbox-gl' {
  const mapboxgl: any;
  export default mapboxgl;
}

declare const mapboxgl: any;
declare const supabase: any;
declare const z: any;

declare const process: {
  env: Record<string, string | undefined>;
  cwd: () => string;
};

declare const Buffer: any;
declare const __dirname: string;

declare interface ImportMetaEnv {
  [key: string]: string | undefined;
}

declare interface ImportMeta {
  env: ImportMetaEnv;
}

declare namespace NodeJS {
  type Timeout = number;
  type Timer = number;
}

declare module '*'
