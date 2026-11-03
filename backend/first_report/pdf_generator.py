import io
import os
from decimal import Decimal
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    KeepTogether,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont


# ==============================================================================
# UNICODE FONT REGISTRATION (TrueType Fonts with Indian Rupee U+20B9 Support)
# ==============================================================================
FONT_NAME_REGULAR = 'AppFont'
FONT_NAME_BOLD = 'AppFont-Bold'

_fonts_registered = False


def ensure_unicode_fonts_registered():
    """
    Registers a TrueType Unicode font family that supports the Indian Rupee symbol (₹, U+20B9).
    Checks project local fonts directory first, then Windows system fonts.
    """
    global _fonts_registered, FONT_NAME_REGULAR, FONT_NAME_BOLD
    if _fonts_registered:
        return

    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    fonts_dir = os.path.join(base_dir, 'fonts')

    # Candidate pairs (regular, bold)
    candidates = [
        # 1. Project local NotoSans
        (
            os.path.join(fonts_dir, 'NotoSans-Regular.ttf'),
            os.path.join(fonts_dir, 'NotoSans-Bold.ttf'),
        ),
        # 2. Project local Arial
        (
            os.path.join(fonts_dir, 'arial.ttf'),
            os.path.join(fonts_dir, 'arialbd.ttf'),
        ),
        # 3. Windows Arial
        (
            'C:\\Windows\\Fonts\\arial.ttf',
            'C:\\Windows\\Fonts\\arialbd.ttf',
        ),
        # 4. Windows Segoe UI
        (
            'C:\\Windows\\Fonts\\segoeui.ttf',
            'C:\\Windows\\Fonts\\segoeuib.ttf',
        ),
        # 5. Windows Nirmala UI
        (
            'C:\\Windows\\Fonts\\Nirmala.ttf',
            'C:\\Windows\\Fonts\\NirmalaB.ttf',
        ),
    ]

    registered = False
    for reg_path, bold_path in candidates:
        if os.path.exists(reg_path) and os.path.exists(bold_path):
            try:
                pdfmetrics.registerFont(TTFont(FONT_NAME_REGULAR, reg_path))
                pdfmetrics.registerFont(TTFont(FONT_NAME_BOLD, bold_path))
                registered = True
                break
            except Exception as err:
                print(f"[PDF Font] Failed to register candidate ({reg_path}, {bold_path}): {err}")

    if not registered:
        # Fallback to standard core fonts if no TTF font could be loaded
        FONT_NAME_REGULAR = 'Helvetica'
        FONT_NAME_BOLD = 'Helvetica-Bold'

    _fonts_registered = True


def format_inr(val):
    """
    Format decimal / float / int to Indian Rupee standard format (e.g. ₹9,15,842.00)
    using actual Unicode character U+20B9 (₹) without any black square.
    """
    if val is None or val == '':
        return '₹0.00'
    try:
        dec = Decimal(str(val))
    except Exception:
        return '₹0.00'

    is_negative = dec < 0
    abs_dec = abs(dec)
    paise_part = f"{abs_dec:.2f}".split('.')[1]
    int_part = int(abs_dec)
    int_str = str(int_part)

    if len(int_str) <= 3:
        formatted_int = int_str
    else:
        last3 = int_str[-3:]
        rest = int_str[:-3]
        groups = []
        while len(rest) > 2:
            groups.insert(0, rest[-2:])
            rest = rest[:-2]
        if rest:
            groups.insert(0, rest)
        formatted_int = ','.join(groups) + ',' + last3

    sign = '-' if is_negative else ''
    return f"{sign}₹{formatted_int}.{paise_part}"


def format_date(dt):
    """
    Format date/datetime/string into DD/MM/YYYY
    """
    if not dt:
        return '-'
    if hasattr(dt, 'strftime'):
        return dt.strftime('%d/%m/%Y')
    s = str(dt).strip()
    if ' ' in s:
        s = s.split(' ')[0]
    if '-' in s:
        parts = s.split('-')
        if len(parts) == 3:
            return f"{parts[2]}/{parts[1]}/{parts[0]}"
    return s


class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas for dynamic total page count calculation,
    consistent running header on pages > 1, and subtle page numbering at bottom right.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        page_w, page_h = self._pagesize
        margin_left = 15 * mm
        margin_right = page_w - 15 * mm

        # Running Top Header on pages > 1
        if self._pageNumber > 1:
            report_title = getattr(self, 'report_title', 'REPORT')
            crm_id = getattr(self, 'crm_id', '')
            rep_date = getattr(self, 'rep_date', '')

            self.setFont(FONT_NAME_BOLD, 8)
            self.setFillColor(colors.HexColor('#202938'))
            self.drawString(margin_left, page_h - 10 * mm, f"CRM  •  {report_title}")

            self.setFont(FONT_NAME_REGULAR, 7.5)
            self.setFillColor(colors.HexColor('#667085'))
            right_txt = f"CRM ID: {crm_id}   |   Report Date: {rep_date}"
            self.drawRightString(margin_right, page_h - 10 * mm, right_txt)

            self.setStrokeColor(colors.HexColor('#E5E7EB'))
            self.setLineWidth(0.6)
            self.line(margin_left, page_h - 11.5 * mm, margin_right, page_h - 11.5 * mm)

        # Bottom Page Numbering at bottom right on all pages
        footer_y = 10 * mm
        self.setFont(FONT_NAME_REGULAR, 8)
        self.setFillColor(colors.HexColor('#667085'))
        self.drawString(margin_left, footer_y, "CONFIDENTIAL  —  FOR INTERNAL & ACCOUNTING USE ONLY")
        self.drawRightString(margin_right, footer_y, f"Page {self._pageNumber} of {page_count}")

        self.restoreState()


class ReportPDFGenerator:
    """
    Minimal, Clean, Enterprise A4 Portrait PDF Generator for CRM Reports.
    Designed with embedded Unicode TTF font supporting ₹ (U+20B9).
    """
    def __init__(self, is_landscape=False):
        ensure_unicode_fonts_registered()
        self.pagesize = A4
        self.page_w, self.page_h = A4
        self.margin = 15 * mm
        self.usable_w = self.page_w - (2 * self.margin)  # 210 - 30 = 180 mm (~510.24 pt)
        self.styles = getSampleStyleSheet()
        self._init_custom_styles()

    def _init_custom_styles(self):
        # Precise Corporate Theme Palette
        self.c_text = colors.HexColor('#202938')       # Primary Text Dark Charcoal
        self.c_muted = colors.HexColor('#667085')      # Secondary Muted Grey
        self.c_th_bg = colors.HexColor('#F3F4F6')      # Table Header Light Grey
        self.c_border = colors.HexColor('#E5E7EB')     # Soft Grey Border
        self.c_white = colors.HexColor('#FFFFFF')      # Pure White Background
        self.c_zebra = colors.HexColor('#F9FAFB')      # Ultra-subtle alternate row
        self.c_total_bg = colors.HexColor('#F3F4F6')   # Soft Total highlight

        # Section Heading
        self.style_section_title = ParagraphStyle(
            'PDFSecTitle',
            fontName=FONT_NAME_BOLD,
            fontSize=11,
            leading=14,
            textColor=self.c_text,
            spaceBefore=0,
            spaceAfter=3,
        )

        # Table Header
        self.style_th = ParagraphStyle(
            'PDFTh',
            fontName=FONT_NAME_BOLD,
            fontSize=8,
            leading=10,
            textColor=self.c_text,
            alignment=0,
        )
        self.style_th_center = ParagraphStyle(
            'PDFThCenter',
            parent=self.style_th,
            alignment=1,
        )
        self.style_th_right = ParagraphStyle(
            'PDFThRight',
            parent=self.style_th,
            alignment=2,
        )

        # Table Data Cells
        self.style_td = ParagraphStyle(
            'PDFTd',
            fontName=FONT_NAME_REGULAR,
            fontSize=8,
            leading=10,
            textColor=self.c_text,
            alignment=0,
        )
        self.style_td_bold = ParagraphStyle(
            'PDFTdBold',
            parent=self.style_td,
            fontName=FONT_NAME_BOLD,
        )
        self.style_td_muted = ParagraphStyle(
            'PDFTdMuted',
            parent=self.style_td,
            textColor=self.c_muted,
        )
        self.style_td_center = ParagraphStyle(
            'PDFTdCenter',
            parent=self.style_td,
            alignment=1,
        )
        self.style_td_right = ParagraphStyle(
            'PDFTdRight',
            parent=self.style_td,
            alignment=2,
        )
        self.style_td_right_bold = ParagraphStyle(
            'PDFTdRightBold',
            parent=self.style_td_bold,
            alignment=2,
        )

    def _build_doc_header(self, report_title, crm_id, report_date):
        """
        Clean, minimal corporate header matching spec:
        CRM
        FIRST REPORT / FINAL CONFIRMATION REPORT
        CRM ID: [Dynamic CRM ID]
        Report Date: [Dynamic Date]
        Followed by a thin grey divider.
        """
        left_p = Paragraph(
            f"<font size='16' color='#202938'><b>CRM</b></font><br/>"
            f"<font size='11' color='#4B5563'><b>{report_title}</b></font>",
            ParagraphStyle('DocHeaderLeft', fontName=FONT_NAME_REGULAR, leading=15)
        )

        right_p = Paragraph(
            f"<font size='9' color='#667085'>CRM ID:</font> "
            f"<font size='9.5' color='#202938'><b>{crm_id}</b></font><br/>"
            f"<font size='9' color='#667085'>Report Date:</font> "
            f"<font size='9.5' color='#202938'><b>{format_date(report_date)}</b></font>",
            ParagraphStyle('DocHeaderRight', fontName=FONT_NAME_REGULAR, leading=14, alignment=2)
        )

        table = Table(
            [[left_p, right_p]],
            colWidths=[self.usable_w * 0.55, self.usable_w * 0.45],
        )
        table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
            ('TOPPADDING', (0, 0), (-1, -1), 0),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('LINEBELOW', (0, 0), (-1, -1), 0.75, self.c_border),
        ]))
        return table

    def _build_tour_and_guest_info(self, report):
        """
        Tour & Guest Information in a clean two-column label/value layout with soft grey grid.
        Column 1: Booking / Tour confirmation details
        Column 2: Guest and itinerary specs
        """
        title = Paragraph("<b>TOUR & GUEST INFORMATION</b>", self.style_section_title)

        data = [
            # Row 1
            [
                Paragraph("Report Date", self.style_td_muted),
                Paragraph(format_date(report.report_date), self.style_td_bold),
                Paragraph("Guest Name", self.style_td_muted),
                Paragraph(str(report.guest_name or '-'), self.style_td_bold),
            ],
            # Row 2
            [
                Paragraph("Travel Date", self.style_td_muted),
                Paragraph(format_date(report.travel_date), self.style_td),
                Paragraph("Mobile Number", self.style_td_muted),
                Paragraph(str(report.mobile_no or '-'), self.style_td),
            ],
            # Row 3
            [
                Paragraph("Tour Type", self.style_td_muted),
                Paragraph(str(report.tour_type or '-'), self.style_td),
                Paragraph("Email ID", self.style_td_muted),
                Paragraph(str(report.email_id or '-'), self.style_td),
            ],
            # Row 4
            [
                Paragraph("CRM ID", self.style_td_muted),
                Paragraph(str(report.crm_id or '-'), self.style_td_bold),
                Paragraph("Destination", self.style_td_muted),
                Paragraph(str(report.destination or '-'), self.style_td_bold),
            ],
            # Row 5
            [
                Paragraph("Sales By", self.style_td_muted),
                Paragraph(str(report.sales_by or '-'), self.style_td),
                Paragraph("Client Type", self.style_td_muted),
                Paragraph(str(report.client_type or '-'), self.style_td),
            ],
            # Row 6
            [
                Paragraph("Branch", self.style_td_muted),
                Paragraph(str(report.branch or '-'), self.style_td),
                Paragraph("Adults / Children", self.style_td_muted),
                Paragraph(f"{report.adults or 0} Adults, {report.child or 0} Children", self.style_td),
            ],
            # Row 7
            [
                Paragraph("Date of Birth (DOB)", self.style_td_muted),
                Paragraph(format_date(report.dob), self.style_td),
                Paragraph("Total Pax", self.style_td_muted),
                Paragraph(f"<b>{report.total_pax or 0} Passengers</b>", self.style_td_bold),
            ],
            # Row 8
            [
                Paragraph("Rooms", self.style_td_muted),
                Paragraph(f"{report.rooms or 0} Room(s)", self.style_td),
                Paragraph("Duration", self.style_td_muted),
                Paragraph(f"{report.duration or 0} Days", self.style_td),
            ],
        ]

        c_lbl = self.usable_w * 0.22
        c_val = self.usable_w * 0.28
        table = Table(data, colWidths=[c_lbl, c_val, c_lbl, c_val])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), self.c_white),
            ('GRID', (0, 0), (-1, -1), 0.5, self.c_border),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('BACKGROUND', (0, 0), (0, -1), self.c_th_bg),
            ('BACKGROUND', (2, 0), (2, -1), self.c_th_bg),
        ]))

        return [KeepTogether([title, table, Spacer(1, 4 * mm)])]

    def _build_client_services_table(self, services_qs):
        """
        Section: Services (Client) Table.
        Clean minimal table with light grey header, thin borders, right-aligned currency,
        wrapped text, repeatRows=1, and bottom Grand Total row.
        """
        title = Paragraph("<b>SERVICES (CLIENT)</b>", self.style_section_title)

        headers = [
            Paragraph("S.No", self.style_th_center),
            Paragraph("Service Description", self.style_th),
            Paragraph("Pax", self.style_th_center),
            Paragraph("Price / Pax (INR)", self.style_th_right),
            Paragraph("Total Amount (INR)", self.style_th_right),
            Paragraph("Remarks", self.style_th),
        ]

        rows = [headers]
        grand_total = Decimal('0.00')

        services_list = list(services_qs)
        if not services_list:
            rows.append([
                Paragraph("-", self.style_td_center),
                Paragraph("No client services recorded", self.style_td_muted),
                Paragraph("-", self.style_td_center),
                Paragraph("₹0.00", self.style_td_right),
                Paragraph("₹0.00", self.style_td_right),
                Paragraph("-", self.style_td_muted),
            ])
        else:
            for idx, s in enumerate(services_list, start=1):
                pax = s.number_of_persons or 0
                price = Decimal(str(s.price_per_person or '0.00'))
                tot = Decimal(str(s.total_cost or (pax * price)))
                grand_total += tot

                sno_str = f"0{idx}" if idx < 10 else str(idx)
                rows.append([
                    Paragraph(sno_str, self.style_td_center),
                    Paragraph(str(s.service or '-'), self.style_td_bold),
                    Paragraph(str(pax), self.style_td_center),
                    Paragraph(format_inr(price), self.style_td_right),
                    Paragraph(format_inr(tot), self.style_td_right_bold),
                    Paragraph(str(s.remarks or '-'), self.style_td),
                ])

        # Bottom Total Row
        rows.append([
            Paragraph("", self.style_td),
            Paragraph("<b>GRAND TOTAL CLIENT COST:</b>", self.style_td_bold),
            Paragraph("", self.style_td),
            Paragraph("", self.style_td),
            Paragraph(f"<b>{format_inr(grand_total)}</b>", self.style_td_right_bold),
            Paragraph("", self.style_td),
        ])

        col_w = [
            self.usable_w * 0.06,
            self.usable_w * 0.34,
            self.usable_w * 0.08,
            self.usable_w * 0.18,
            self.usable_w * 0.18,
            self.usable_w * 0.16,
        ]
        table = Table(rows, colWidths=col_w, repeatRows=1)

        t_style = [
            ('BACKGROUND', (0, 0), (-1, 0), self.c_th_bg),
            ('GRID', (0, 0), (-1, -1), 0.5, self.c_border),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('LEFTPADDING', (0, 0), (-1, -1), 5),
            ('RIGHTPADDING', (0, 0), (-1, -1), 5),
        ]

        for r_idx in range(1, len(rows) - 1):
            if r_idx % 2 == 0:
                t_style.append(('BACKGROUND', (0, r_idx), (-1, r_idx), self.c_zebra))

        tot_idx = len(rows) - 1
        t_style.extend([
            ('BACKGROUND', (0, tot_idx), (-1, tot_idx), self.c_total_bg),
            ('SPAN', (1, tot_idx), (3, tot_idx)),
            ('TOPPADDING', (0, tot_idx), (-1, tot_idx), 5),
            ('BOTTOMPADDING', (0, tot_idx), (-1, tot_idx), 5),
        ])

        table.setStyle(TableStyle(t_style))
        return [title, table, Spacer(1, 4 * mm)], grand_total

    def _build_dmc_services_table(self, dmc_qs):
        """
        Section: Booking Services (DMC / Vendors) Table.
        Clean minimal table with light grey header, thin borders, right-aligned currency,
        repeatRows=1, and bottom Total DMC Cost row.
        """
        title = Paragraph("<b>BOOKING SERVICES (DMC / VENDORS)</b>", self.style_section_title)

        headers = [
            Paragraph("S.No", self.style_th_center),
            Paragraph("Service", self.style_th),
            Paragraph("Vendor / Supplier", self.style_th),
            Paragraph("Contact No", self.style_th),
            Paragraph("Pax", self.style_th_center),
            Paragraph("Price / Pax (INR)", self.style_th_right),
            Paragraph("Total Amount (INR)", self.style_th_right),
        ]

        rows = [headers]
        grand_total = Decimal('0.00')

        dmc_list = list(dmc_qs)
        if not dmc_list:
            rows.append([
                Paragraph("-", self.style_td_center),
                Paragraph("No vendor booking services recorded", self.style_td_muted),
                Paragraph("-", self.style_td),
                Paragraph("-", self.style_td),
                Paragraph("-", self.style_td_center),
                Paragraph("₹0.00", self.style_td_right),
                Paragraph("₹0.00", self.style_td_right),
            ])
        else:
            for idx, d in enumerate(dmc_list, start=1):
                pax = d.number_of_persons or 0
                price = Decimal(str(d.price_per_pax or '0.00'))
                tot = Decimal(str(d.total_payable or (pax * price)))
                grand_total += tot

                sno_str = f"0{idx}" if idx < 10 else str(idx)
                rows.append([
                    Paragraph(sno_str, self.style_td_center),
                    Paragraph(str(d.service or '-'), self.style_td_bold),
                    Paragraph(str(d.vendor or '-'), self.style_td),
                    Paragraph(str(d.contact_no or '-'), self.style_td),
                    Paragraph(str(pax), self.style_td_center),
                    Paragraph(format_inr(price), self.style_td_right),
                    Paragraph(format_inr(tot), self.style_td_right_bold),
                ])

        # Bottom Total Row
        rows.append([
            Paragraph("", self.style_td),
            Paragraph("<b>TOTAL DMC / VENDOR EXPENSE:</b>", self.style_td_bold),
            Paragraph("", self.style_td),
            Paragraph("", self.style_td),
            Paragraph("", self.style_td),
            Paragraph("", self.style_td),
            Paragraph(f"<b>{format_inr(grand_total)}</b>", self.style_td_right_bold),
        ])

        col_w = [
            self.usable_w * 0.06,
            self.usable_w * 0.23,
            self.usable_w * 0.20,
            self.usable_w * 0.15,
            self.usable_w * 0.08,
            self.usable_w * 0.14,
            self.usable_w * 0.14,
        ]
        table = Table(rows, colWidths=col_w, repeatRows=1)

        t_style = [
            ('BACKGROUND', (0, 0), (-1, 0), self.c_th_bg),
            ('GRID', (0, 0), (-1, -1), 0.5, self.c_border),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('LEFTPADDING', (0, 0), (-1, -1), 5),
            ('RIGHTPADDING', (0, 0), (-1, -1), 5),
        ]

        for r_idx in range(1, len(rows) - 1):
            if r_idx % 2 == 0:
                t_style.append(('BACKGROUND', (0, r_idx), (-1, r_idx), self.c_zebra))

        tot_idx = len(rows) - 1
        t_style.extend([
            ('BACKGROUND', (0, tot_idx), (-1, tot_idx), self.c_total_bg),
            ('SPAN', (1, tot_idx), (5, tot_idx)),
            ('TOPPADDING', (0, tot_idx), (-1, tot_idx), 5),
            ('BOTTOMPADDING', (0, tot_idx), (-1, tot_idx), 5),
        ])

        table.setStyle(TableStyle(t_style))
        return [title, table, Spacer(1, 4 * mm)], grand_total

    def _build_first_report_profit_summary(self, client_cost, dmc_expense):
        """
        First Report Financial Summary:
        - Total Client Cost
        - Total DMC Expense
        - Approximate Profit = Total Client Cost - Total DMC Expense
        """
        title = Paragraph("<b>FINANCIAL SUMMARY</b>", self.style_section_title)
        approx_profit = client_cost - dmc_expense

        data = [
            [
                Paragraph("Total Client Cost (Services Grand Total)", self.style_td),
                Paragraph(format_inr(client_cost), self.style_td_right_bold),
            ],
            [
                Paragraph("Total DMC Expense (Booking DMC Grand Total)", self.style_td),
                Paragraph(format_inr(dmc_expense), self.style_td_right_bold),
            ],
            [
                Paragraph("<b>Approximate Profit (Client Cost − DMC Expense)</b>", self.style_td_bold),
                Paragraph(f"<b>{format_inr(approx_profit)}</b>", self.style_td_right_bold),
            ],
        ]

        table = Table(data, colWidths=[self.usable_w * 0.65, self.usable_w * 0.35])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -2), self.c_white),
            ('BACKGROUND', (0, -1), (-1, -1), self.c_total_bg),
            ('GRID', (0, 0), (-1, -1), 0.5, self.c_border),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))

        wrapper = Table([[table]], colWidths=[self.usable_w * 0.65], hAlign='LEFT')
        wrapper.setStyle(TableStyle([
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
            ('TOPPADDING', (0, 0), (-1, -1), 0),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ]))

        return [KeepTogether([title, wrapper, Spacer(1, 4 * mm)])]

    def _build_final_report_gst_and_financial_summary(self, report, client_cost, dmc_expense):
        """
        Sections 5 & 6: GST Details & Calculation and Final Financial Summary.
        Compact, clean corporate financial table.
        """
        title = Paragraph("<b>GST & FINANCIAL SUMMARY</b>", self.style_section_title)

        is_gst = bool(report.gst_collected)
        gst_pct = Decimal(str(report.gst_percentage or '0.00')) if is_gst else Decimal('0.00')
        base_cost = Decimal(str(report.base_total_cost or client_cost))
        gst_amt = Decimal(str(report.gst_amount or '0.00')) if is_gst else Decimal('0.00')
        tc_with_gst = client_cost + gst_amt
        proc_fee = Decimal(str(report.processing_fee or '0.00'))
        net_profit = tc_with_gst - dmc_expense - proc_fee

        gst_info_data = [
            [
                Paragraph("GST Applicable", self.style_td_muted),
                Paragraph("Yes" if is_gst else "No", self.style_td_bold),
                Paragraph("GST Rate", self.style_td_muted),
                Paragraph(f"{gst_pct}%" if is_gst else "0%", self.style_td),
                Paragraph("GST Date", self.style_td_muted),
                Paragraph(format_date(report.gst_collected_date) if is_gst else "-", self.style_td),
            ]
        ]
        t_gst_info = Table(gst_info_data, colWidths=[
            self.usable_w * 0.18, self.usable_w * 0.15,
            self.usable_w * 0.18, self.usable_w * 0.15,
            self.usable_w * 0.18, self.usable_w * 0.16
        ])
        t_gst_info.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), self.c_white),
            ('GRID', (0, 0), (-1, -1), 0.5, self.c_border),
            ('BACKGROUND', (0, 0), (0, 0), self.c_th_bg),
            ('BACKGROUND', (2, 0), (2, 0), self.c_th_bg),
            ('BACKGROUND', (4, 0), (4, 0), self.c_th_bg),
            ('TOPPADDING', (0, 0), (-1, -1), 3.5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3.5),
            ('LEFTPADDING', (0, 0), (-1, -1), 5),
            ('RIGHTPADDING', (0, 0), (-1, -1), 5),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))

        # Financial breakdown table
        fin_data = [
            [
                Paragraph("Base Total Cost (Services Client Grand Total)", self.style_td),
                Paragraph(format_inr(base_cost), self.style_td_right),
            ],
            [
                Paragraph(f"GST Amount ({gst_pct}% on base services)", self.style_td),
                Paragraph(format_inr(gst_amt), self.style_td_right),
            ],
            [
                Paragraph("<b>Total Cost with GST (Gross Client Billing)</b>", self.style_td_bold),
                Paragraph(f"<b>{format_inr(tc_with_gst)}</b>", self.style_td_right_bold),
            ],
            [
                Paragraph("Total DMC Expense (Booking Services DMC)", self.style_td),
                Paragraph(format_inr(dmc_expense), self.style_td_right),
            ],
            [
                Paragraph("Processing Fee (Deductions)", self.style_td),
                Paragraph(format_inr(proc_fee), self.style_td_right),
            ],
            [
                Paragraph("<b>NET PROFIT (Total Cost with GST − Total DMC Expense − Processing Fee)</b>", self.style_td_bold),
                Paragraph(f"<b>{format_inr(net_profit)}</b>", self.style_td_right_bold),
            ],
        ]

        t_fin = Table(fin_data, colWidths=[self.usable_w * 0.65, self.usable_w * 0.35])
        t_fin.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), self.c_white),
            ('GRID', (0, 0), (-1, -1), 0.5, self.c_border),
            ('BACKGROUND', (0, 2), (-1, 2), self.c_th_bg),
            ('BACKGROUND', (0, -1), (-1, -1), self.c_total_bg),
            ('TOPPADDING', (0, 0), (-1, -1), 3.5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3.5),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))

        wrapper = Table([[t_fin]], colWidths=[self.usable_w * 0.70], hAlign='LEFT')
        wrapper.setStyle(TableStyle([
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
            ('TOPPADDING', (0, 0), (-1, -1), 0),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ]))

        return [
            KeepTogether([
                title,
                t_gst_info,
                Spacer(1, 2.5 * mm),
                wrapper,
                Spacer(1, 4 * mm)
            ])
        ], net_profit

    def _build_payments_and_spent_tables(self, payments_qs, payments_spent_qs):
        """
        Sections 7 & 8: Payment Collection & Payment Spent tables.
        Visually consistent with Services and DMC tables.
        """
        # Section 7: Payment Collection
        s7_title = Paragraph("<b>PAYMENT COLLECTION (CLIENT RECEIPTS)</b>", self.style_section_title)
        s7_headers = [
            Paragraph("S.No", self.style_th_center),
            Paragraph("Date", self.style_th_center),
            Paragraph("Payment Mode", self.style_th),
            Paragraph("Amount (INR)", self.style_th_right),
        ]
        s7_rows = [s7_headers]
        tot_collected = Decimal('0.00')

        pay_list = list(payments_qs)
        if not pay_list:
            s7_rows.append([
                Paragraph("-", self.style_td_center),
                Paragraph("-", self.style_td_center),
                Paragraph("No payment receipts recorded", self.style_td_muted),
                Paragraph("₹0.00", self.style_td_right),
            ])
        else:
            for idx, p in enumerate(pay_list, start=1):
                amt = Decimal(str(p.amount or '0.00'))
                tot_collected += amt
                sno_str = f"0{idx}" if idx < 10 else str(idx)
                s7_rows.append([
                    Paragraph(sno_str, self.style_td_center),
                    Paragraph(format_date(p.payment_date), self.style_td_center),
                    Paragraph(str(p.payment_mode or '-'), self.style_td),
                    Paragraph(format_inr(amt), self.style_td_right_bold),
                ])

        s7_rows.append([
            Paragraph("", self.style_td),
            Paragraph("<b>TOTAL COLLECTED:</b>", self.style_td_bold),
            Paragraph("", self.style_td),
            Paragraph(f"<b>{format_inr(tot_collected)}</b>", self.style_td_right_bold),
        ])

        t7_w = self.usable_w * 0.485
        t7 = Table(s7_rows, colWidths=[t7_w * 0.12, t7_w * 0.28, t7_w * 0.32, t7_w * 0.28], repeatRows=1)
        t7_style = [
            ('BACKGROUND', (0, 0), (-1, 0), self.c_th_bg),
            ('GRID', (0, 0), (-1, -1), 0.5, self.c_border),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 3.5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3.5),
            ('LEFTPADDING', (0, 0), (-1, -1), 4),
            ('RIGHTPADDING', (0, 0), (-1, -1), 4),
            ('BACKGROUND', (0, -1), (-1, -1), self.c_total_bg),
            ('SPAN', (1, -1), (2, -1)),
        ]
        for r_idx in range(1, len(s7_rows) - 1):
            if r_idx % 2 == 0:
                t7_style.append(('BACKGROUND', (0, r_idx), (-1, r_idx), self.c_zebra))
        t7.setStyle(TableStyle(t7_style))

        # Section 8: Payment Spent
        s8_title = Paragraph("<b>PAYMENT SPENT (SUPPLIER DISBURSEMENTS)</b>", self.style_section_title)
        s8_headers = [
            Paragraph("S.No", self.style_th_center),
            Paragraph("Details", self.style_th),
            Paragraph("Date", self.style_th_center),
            Paragraph("Mode", self.style_th),
            Paragraph("Amount (INR)", self.style_th_right),
        ]
        s8_rows = [s8_headers]
        tot_spent = Decimal('0.00')

        spent_list = list(payments_spent_qs)
        if not spent_list:
            s8_rows.append([
                Paragraph("-", self.style_td_center),
                Paragraph("No disbursements recorded", self.style_td_muted),
                Paragraph("-", self.style_td_center),
                Paragraph("-", self.style_td),
                Paragraph("₹0.00", self.style_td_right),
            ])
        else:
            for idx, ps in enumerate(spent_list, start=1):
                amt = Decimal(str(ps.amount or '0.00'))
                tot_spent += amt
                sno_str = f"0{idx}" if idx < 10 else str(idx)
                s8_rows.append([
                    Paragraph(sno_str, self.style_td_center),
                    Paragraph(str(ps.details or '-'), self.style_td_bold),
                    Paragraph(format_date(ps.payment_date), self.style_td_center),
                    Paragraph(str(ps.payment_mode or '-'), self.style_td),
                    Paragraph(format_inr(amt), self.style_td_right_bold),
                ])

        s8_rows.append([
            Paragraph("", self.style_td),
            Paragraph("<b>TOTAL SPENT:</b>", self.style_td_bold),
            Paragraph("", self.style_td),
            Paragraph("", self.style_td),
            Paragraph(f"<b>{format_inr(tot_spent)}</b>", self.style_td_right_bold),
        ])

        t8_w = self.usable_w * 0.495
        t8 = Table(s8_rows, colWidths=[t8_w * 0.12, t8_w * 0.28, t8_w * 0.22, t8_w * 0.14, t8_w * 0.24], repeatRows=1)
        t8_style = [
            ('BACKGROUND', (0, 0), (-1, 0), self.c_th_bg),
            ('GRID', (0, 0), (-1, -1), 0.5, self.c_border),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 3.5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3.5),
            ('LEFTPADDING', (0, 0), (-1, -1), 4),
            ('RIGHTPADDING', (0, 0), (-1, -1), 4),
            ('BACKGROUND', (0, -1), (-1, -1), self.c_total_bg),
            ('SPAN', (1, -1), (3, -1)),
        ]
        for r_idx in range(1, len(s8_rows) - 1):
            if r_idx % 2 == 0:
                t8_style.append(('BACKGROUND', (0, r_idx), (-1, r_idx), self.c_zebra))
        t8.setStyle(TableStyle(t8_style))

        wrapper = Table(
            [[Table([[s7_title], [t7]]), Table([[s8_title], [t8]])]],
            colWidths=[self.usable_w * 0.49, self.usable_w * 0.51]
        )
        wrapper.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
            ('TOPPADDING', (0, 0), (-1, -1), 0),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ]))

        return [KeepTogether([wrapper, Spacer(1, 4 * mm)])], tot_collected, tot_spent

    def _build_payment_balance_summary(self, client_cost, tot_collected, dmc_expense, tot_spent):
        """
        Section 9: Payment Balance Summary.
        Two clean summary blocks side-by-side:
        Client Payment Balance vs Supplier Payment Balance.
        Bold text for outstanding balances, clean minimal styling.
        """
        title = Paragraph("<b>PAYMENT BALANCE SUMMARY</b>", self.style_section_title)

        client_diff = client_cost - tot_collected
        supplier_diff = dmc_expense - tot_spent

        client_card_data = [
            [
                Paragraph("<b>CLIENT PAYMENT BALANCE</b>", self.style_td_bold),
                Paragraph("<b>AMOUNT (INR)</b>", self.style_td_right_bold),
            ],
            [
                Paragraph("Total Client Amount (Services Grand Total)", self.style_td),
                Paragraph(format_inr(client_cost), self.style_td_right),
            ],
            [
                Paragraph("Total Collected (Client Receipts)", self.style_td),
                Paragraph(format_inr(tot_collected), self.style_td_right),
            ],
            [
                Paragraph("<b>Yet to Receive (Client Balance)</b>", self.style_td_bold),
                Paragraph(f"<b>{format_inr(client_diff)}</b>", self.style_td_right_bold),
            ],
        ]
        w_half = self.usable_w * 0.49
        t_client = Table(client_card_data, colWidths=[w_half * 0.65, w_half * 0.35])
        t_client.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), self.c_th_bg),
            ('GRID', (0, 0), (-1, -1), 0.5, self.c_border),
            ('BACKGROUND', (0, -1), (-1, -1), self.c_total_bg),
            ('TOPPADDING', (0, 0), (-1, -1), 3.5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3.5),
            ('LEFTPADDING', (0, 0), (-1, -1), 5),
            ('RIGHTPADDING', (0, 0), (-1, -1), 5),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))

        supplier_card_data = [
            [
                Paragraph("<b>SUPPLIER PAYMENT BALANCE</b>", self.style_td_bold),
                Paragraph("<b>AMOUNT (INR)</b>", self.style_td_right_bold),
            ],
            [
                Paragraph("Total Supplier Amount (Booking DMC Grand Total)", self.style_td),
                Paragraph(format_inr(dmc_expense), self.style_td_right),
            ],
            [
                Paragraph("Total Paid (Disbursed to Suppliers)", self.style_td),
                Paragraph(format_inr(tot_spent), self.style_td_right),
            ],
            [
                Paragraph("<b>Yet to Pay (Supplier Balance)</b>", self.style_td_bold),
                Paragraph(f"<b>{format_inr(supplier_diff)}</b>", self.style_td_right_bold),
            ],
        ]
        w_half2 = self.usable_w * 0.49
        t_supplier = Table(supplier_card_data, colWidths=[w_half2 * 0.65, w_half2 * 0.35])
        t_supplier.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), self.c_th_bg),
            ('GRID', (0, 0), (-1, -1), 0.5, self.c_border),
            ('BACKGROUND', (0, -1), (-1, -1), self.c_total_bg),
            ('TOPPADDING', (0, 0), (-1, -1), 3.5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3.5),
            ('LEFTPADDING', (0, 0), (-1, -1), 5),
            ('RIGHTPADDING', (0, 0), (-1, -1), 5),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))

        wrapper = Table(
            [[t_client, t_supplier]],
            colWidths=[self.usable_w * 0.49, self.usable_w * 0.51]
        )
        wrapper.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
            ('TOPPADDING', (0, 0), (-1, -1), 0),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ]))

        return [KeepTogether([title, wrapper, Spacer(1, 4 * mm)])]

    def _build_signature_footer(self, report):
        """
        End of report signature lines matching spec:
        Prepared By: __________
        Verified By: __________
        Authorized Signature: __________
        """
        sales_person = str(report.sales_by or 'Sales Executive')

        p_prep = Paragraph(
            f"<b>Prepared By:</b> ____________________<br/>"
            f"<font size='7' color='#667085'>({sales_person})</font>",
            ParagraphStyle('SignPrep', fontName=FONT_NAME_REGULAR, fontSize=8, leading=11, alignment=0)
        )
        p_ver = Paragraph(
            f"<b>Verified By:</b> ____________________<br/>"
            f"<font size='7' color='#667085'>(Operations / Accounts)</font>",
            ParagraphStyle('SignVer', fontName=FONT_NAME_REGULAR, fontSize=8, leading=11, alignment=1)
        )
        p_auth = Paragraph(
            f"<b>Authorized Signature:</b> ____________________<br/>"
            f"<font size='7' color='#667085'>(Branch Manager / Director)</font>",
            ParagraphStyle('SignAuth', fontName=FONT_NAME_REGULAR, fontSize=8, leading=11, alignment=2)
        )

        sign_table = Table(
            [[p_prep, p_ver, p_auth]],
            colWidths=[self.usable_w * 0.33, self.usable_w * 0.34, self.usable_w * 0.33]
        )
        sign_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
            ('TOPPADDING', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('LINEABOVE', (0, 0), (-1, 0), 0.5, self.c_border),
        ]))

        return KeepTogether([Spacer(1, 4 * mm), sign_table])

    def generate_first_report_pdf(self, report):
        """
        Produce a print-ready A4 Portrait PDF binary for a FirstReport instance.
        """
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=self.pagesize,
            leftMargin=self.margin,
            rightMargin=self.margin,
            topMargin=self.margin,
            bottomMargin=self.margin,
        )

        story = []

        # 1. Clean Header
        hdr = self._build_doc_header(
            "FIRST REPORT",
            report.crm_id,
            report.report_date,
        )
        story.append(hdr)
        story.append(Spacer(1, 4 * mm))

        # 2. Tour & Guest Information
        story.extend(self._build_tour_and_guest_info(report))

        # 3. Services (Client)
        s3_elements, client_cost = self._build_client_services_table(report.client_services.all())
        story.extend(s3_elements)

        # 4. Booking Services (DMC)
        s4_elements, dmc_expense = self._build_dmc_services_table(report.dmc_services.all())
        story.extend(s4_elements)

        # 5. Financial Summary
        story.extend(self._build_first_report_profit_summary(client_cost, dmc_expense))

        # 6. Signature Lines
        story.append(self._build_signature_footer(report))

        # Canvas with Dynamic Page Stamping
        def make_canvas(*args, **kwargs):
            canvas_obj = NumberedCanvas(*args, **kwargs)
            canvas_obj.report_title = "FIRST REPORT"
            canvas_obj.crm_id = str(report.crm_id or '')
            canvas_obj.rep_date = format_date(report.report_date)
            return canvas_obj

        doc.build(story, canvasmaker=make_canvas)
        buffer.seek(0)
        return buffer.getvalue()

    def generate_final_report_pdf(self, report):
        """
        Produce a print-ready A4 Portrait PDF binary for a FinalReport instance.
        """
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=self.pagesize,
            leftMargin=self.margin,
            rightMargin=self.margin,
            topMargin=self.margin,
            bottomMargin=self.margin,
        )

        story = []

        # 1. Clean Header
        hdr = self._build_doc_header(
            "FINAL CONFIRMATION REPORT",
            report.crm_id,
            report.report_date,
        )
        story.append(hdr)
        story.append(Spacer(1, 4 * mm))

        # 2. Tour & Guest Information
        story.extend(self._build_tour_and_guest_info(report))

        # 3. Services (Client)
        s3_elements, client_cost = self._build_client_services_table(report.client_services.all())
        story.extend(s3_elements)

        # 4. Booking Services (DMC)
        s4_elements, dmc_expense = self._build_dmc_services_table(report.dmc_services.all())
        story.extend(s4_elements)

        # 5 & 6. GST & Financial Summary
        s56_elements, net_profit = self._build_final_report_gst_and_financial_summary(report, client_cost, dmc_expense)
        story.extend(s56_elements)

        # 7 & 8. Payments Collection & Spent
        s78_elements, tot_collected, tot_spent = self._build_payments_and_spent_tables(
            report.payments.all(),
            report.payments_spent.all()
        )
        story.extend(s78_elements)

        # 9. Payment Balance Summary
        story.extend(self._build_payment_balance_summary(client_cost, tot_collected, dmc_expense, tot_spent))

        # 10. Signature Lines
        story.append(self._build_signature_footer(report))

        # Canvas with Dynamic Page Stamping
        def make_canvas(*args, **kwargs):
            canvas_obj = NumberedCanvas(*args, **kwargs)
            canvas_obj.report_title = "FINAL CONFIRMATION REPORT"
            canvas_obj.crm_id = str(report.crm_id or '')
            canvas_obj.rep_date = format_date(report.report_date)
            return canvas_obj

        doc.build(story, canvasmaker=make_canvas)
        buffer.seek(0)
        return buffer.getvalue()
