import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error("HomeHub crashed:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-base p-6" dir="rtl">
          <div className="w-full max-w-sm bg-white rounded-xl2 p-6 shadow-sm">
            <div className="font-display font-extrabold text-xl text-terracotta mb-2">משהו השתבש</div>
            <div className="text-mutedDark text-sm leading-relaxed mb-3">
              קרתה שגיאה בטעינת האפליקציה. פרטים בקונסול הדפדפן (F12).
            </div>
            <div className="text-xs text-muted break-all bg-chip rounded-lg p-2">
              {String(this.state.error?.message || this.state.error)}
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
