package in.curebolt.customer;

import android.annotation.SuppressLint;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {
    private WebView webView;

    @Override
    @SuppressLint("SetJavaScriptEnabled")
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        webView = new WebView(this);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
                // Render offline launch fallback with CureBolt mascot and branding
                String fallbackHtml = "<!DOCTYPE html><html><head><meta name='viewport' content='width=device-width,initial-scale=1.0'>"
                    + "<style>body{margin:0;background:#0d1117;color:#fff;font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;text-align:center;padding:24px;}"
                    + ".brand{font-size:2rem;font-weight:900;color:#00E676;margin-bottom:8px;}.tagline{color:#94a3b8;margin-bottom:24px;}"
                    + ".badge{background:#16a34a22;border:1px solid #16a34a;color:#4ade80;padding:6px 14px;border-radius:99px;font-size:0.85rem;margin-bottom:20px;}"
                    + ".btn{background:#16a34a;color:#fff;border:none;padding:12px 24px;border-radius:12px;font-size:1rem;font-weight:700;margin:6px;width:80%;max-width:280px;cursor:pointer;}"
                    + ".btn-outline{background:transparent;border:2px solid #38bdf8;color:#38bdf8;}</style></head><body>"
                    + "<div class='brand'>⚡ CureBolt</div>"
                    + "<div class='badge'>🚀 Customer 10-Min Medicine Delivery</div>"
                    + "<p class='tagline'>Gorakhpur Express Health & Veterinary Logistics</p>"
                    + "<button class='btn' onclick=\"location.href='http://10.0.2.2:3001'\">Open Customer Portal</button>"
                    + "<button class='btn btn-outline' onclick=\"location.reload()\">Retry Connection</button>"
                    + "</body></html>";
                view.loadDataWithBaseURL(null, fallbackHtml, "text/html", "utf-8", null);
            }
        });

        // 10.0.2.2 is Android Emulator alias for host localhost
        webView.loadUrl("http://10.0.2.2:3001");
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
