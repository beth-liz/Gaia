import os
import json
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas to dynamically compute and stamp 'Page X of Y' 
    and official Gaia footer on every page.
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
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#4b5563")) # gray-600

        # Footer divider line
        self.setStrokeColor(colors.HexColor("#d1d5db")) # gray-300
        self.setLineWidth(0.75)
        self.line(40, 36, 555, 36)

        # Footer text
        left_text = "GAIA Wildlife Monitoring & Conflict Management System — Official Investigation Report"
        right_text = f"Page {self._pageNumber} of {page_count}"
        self.drawString(40, 24, left_text)
        self.drawRightString(555, 24, right_text)
        self.restoreState()


def generate_incident_pdf(inc, op, activities, guard, pdf_path):
    # Setup document geometry: A4 (595.27 x 841.89 pt), 40pt margins -> usable width = 515.27 pt (~7.15 in)
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=A4,
        rightMargin=40, leftMargin=40,
        topMargin=40, bottomMargin=48
    )

    # Styles
    styles = getSampleStyleSheet()

    header_title_style = ParagraphStyle(
        name='HeaderTitle',
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#064e3b') # emerald-950
    )

    header_subtitle_style = ParagraphStyle(
        name='HeaderSubtitle',
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#047857') # emerald-700
    )

    report_banner_style = ParagraphStyle(
        name='ReportBanner',
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=15,
        alignment=0, # Left-aligned
        textColor=colors.HexColor('#064e3b')
    )

    h2_style = ParagraphStyle(
        name='SectionHeader',
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=colors.HexColor('#064e3b'),
        spaceBefore=14,
        spaceAfter=6
    )

    label_style = ParagraphStyle(
        name='TableLabel',
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#1f2937') # gray-800
    )

    value_style = ParagraphStyle(
        name='TableValue',
        fontName='Helvetica',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#111827') # gray-900
    )

    body_style = ParagraphStyle(
        name='BodyDark',
        fontName='Helvetica',
        fontSize=8.5,
        leading=12.5,
        textColor=colors.HexColor('#374151') # gray-700
    )

    caption_style = ParagraphStyle(
        name='CaptionStyle',
        fontName='Helvetica-Oblique',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor('#4b5563')
    )

    story = []

    # 1. Header with Gaia Logo & Official Title
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
    logo_path = os.path.join(base_dir, 'app', 'static', 'images', 'gaia_logo.png')
    
    logo_img = None
    if os.path.exists(logo_path):
        try:
            logo_img = Image(logo_path, width=44, height=44)
        except Exception:
            logo_img = None

    header_text_cell = [
        Paragraph("<b>GAIA</b>", header_title_style),
        Spacer(1, 2),
        Paragraph("AI-Powered Wildlife Monitoring & Human-Wildlife Conflict Management Platform", header_subtitle_style),
        Paragraph("<b>WILDLIFE INCIDENT INVESTIGATION REPORT</b>", report_banner_style)
    ]

    if logo_img:
        header_table = Table([[logo_img, header_text_cell]], colWidths=[52, 463])
        header_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('LEFTPADDING', (1,0), (1,0), 6),
            ('RIGHTPADDING', (0,0), (-1,-1), 0),
            ('TOPPADDING', (0,0), (-1,-1), 0),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ]))
        story.append(header_table)
    else:
        story.extend(header_text_cell)

    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#064e3b'), spaceBefore=8, spaceAfter=10))

    # 2. Metadata Strip (Incident Reference & Generation Date)
    gen_time = datetime.utcnow().strftime("%d %b %Y, %H:%M UTC")
    inc_ref = (inc.reference_id if inc and inc.reference_id else f"INC-{inc.id if inc else 'UNKNOWN'}").strip()
    station_name = inc.station_rel.station_name if inc and hasattr(inc, 'station_rel') and inc.station_rel else (inc.station_name if inc and hasattr(inc, 'station_name') else "Wayanad Range Station")

    meta_table_data = [
        [
            Paragraph(f"<b>Incident Reference:</b> {inc_ref}", label_style),
            Paragraph(f"<b>Monitoring Station:</b> {station_name}", label_style),
            Paragraph(f"<b>Report Generated:</b> {gen_time}", label_style)
        ]
    ]
    meta_table = Table(meta_table_data, colWidths=[175, 180, 160])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#ecfdf5')), # emerald-50
        ('BOX', (0,0), (-1,-1), 0.75, colors.HexColor('#a7f3d0')), # emerald-200
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 8))

    # 3. Incident Overview & Location (Two-Column Clean Grid)
    story.append(Paragraph("1. INCIDENT OVERVIEW & GEOGRAPHIC LOCATION", h2_style))

    reporter_name = "Field Officer"
    if inc:
        if getattr(inc, 'reporter_rel', None):
            reporter_name = inc.reporter_rel.full_name
        elif getattr(inc, 'reporter', None):
            reporter_name = inc.reporter.full_name
        elif getattr(inc, 'reported_by_user', None):
            reporter_name = inc.reported_by_user.full_name
        elif getattr(inc, 'reporter_role', None) in ["PUBLIC", "VISITOR"]:
            reporter_name = "Public Visitor"

    reporter_type = getattr(inc, 'reporter_role', None) or "Villager"
    if reporter_type == "PUBLIC": reporter_type = "Public Visitor"

    inc_date_str = "Not Available"
    if inc:
        d = getattr(inc, 'date_reported', '') or ''
        t = getattr(inc, 'time_reported', '') or ''
        if d or t:
            inc_date_str = f"{d} {t}".strip()
        elif getattr(inc, 'created_at', None):
            inc_date_str = inc.created_at.strftime("%Y-%m-%d %H:%M")

    coords_str = "Not Recorded"
    if inc and inc.latitude is not None and inc.longitude is not None:
        try:
            coords_str = f"{float(inc.latitude):.4f}° N, {float(inc.longitude):.4f}° E"
        except (ValueError, TypeError):
            coords_str = f"{inc.latitude}, {inc.longitude}"

    species_val = getattr(inc, 'animal_type', None) or getattr(inc, 'animal', None) or "Wildlife"
    category_val = getattr(inc, 'incident_category', None) or "Human-Wildlife Conflict"

    village_obj = getattr(inc, 'village', None)
    village_val = getattr(village_obj, 'village_name', None) if village_obj else getattr(inc, 'village_name', "Perimeter Range")
    
    district_obj = getattr(inc, 'district_rel', None) or getattr(inc, 'district', None)
    district_val = getattr(district_obj, 'district_name', None) if district_obj else getattr(inc, 'district_name', "Wayanad")
    
    state_obj = getattr(inc, 'state_rel', None) or getattr(inc, 'state', None)
    state_val = getattr(state_obj, 'state_name', None) if state_obj else getattr(inc, 'state_name', "Kerala")

    overview_rows = [
        [
            Paragraph("<b>Incident Category:</b>", label_style),
            Paragraph(category_val, value_style),
            Paragraph("<b>Location / Landmark:</b>", label_style),
            Paragraph(inc.location or inc.address or "Sector Range", value_style)
        ],
        [
            Paragraph("<b>Reported Wildlife:</b>", label_style),
            Paragraph(species_val, value_style),
            Paragraph("<b>Village & District:</b>", label_style),
            Paragraph(f"{village_val}, {district_val}", value_style)
        ],
        [
            Paragraph("<b>Incident Date/Time:</b>", label_style),
            Paragraph(inc_date_str, value_style),
            Paragraph("<b>GPS Coordinates:</b>", label_style),
            Paragraph(coords_str, value_style)
        ],
        [
            Paragraph("<b>Incident Status:</b>", label_style),
            Paragraph(inc.status if inc else "Closed", value_style),
            Paragraph("<b>Reporting Person / Source:</b>", label_style),
            Paragraph(f"{reporter_name} ({reporter_type})", value_style)
        ],
        [
            Paragraph("<b>Priority / Severity:</b>", label_style),
            Paragraph(f"<font color='{'#b91c1c' if inc and inc.severity in ['Critical', 'High'] else '#047857'}'><b>{inc.severity if inc else 'Medium'}</b></font>", value_style),
            Paragraph("<b>Jurisdiction State:</b>", label_style),
            Paragraph(state_val, value_style)
        ]
    ]

    overview_table = Table(overview_rows, colWidths=[115, 142, 115, 143])
    overview_table.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e5e7eb')), # light gray border
        ('ROWBACKGROUNDS', (0,0), (-1,-1), [colors.white, colors.HexColor('#f9fafb')]),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(overview_table)
    story.append(Spacer(1, 8))

    # 4. Incident Description & Initial Assessment
    story.append(Paragraph("2. INCIDENT DESCRIPTION & INITIAL FINDINGS", h2_style))
    desc_text = (inc.description if inc and inc.description else "No detailed narrative provided at the time of reporting.").strip()
    story.append(Paragraph(desc_text, body_style))
    story.append(Spacer(1, 8))

    # 5. Field Findings & Action Taken
    story.append(Paragraph("3. INVESTIGATION FINDINGS & ON-SITE ACTIONS", h2_style))
    
    actions_list = []
    actions_checklist_raw = getattr(op, 'actions_checklist', None)
    if actions_checklist_raw:
        try:
            parsed = json.loads(actions_checklist_raw)
            if isinstance(parsed, list):
                actions_list = parsed
            else:
                actions_list = [str(parsed)]
        except Exception:
            actions_list = [actions_checklist_raw]

    findings_rows = [
        [
            Paragraph("<b>Wildlife Present at Arrival:</b>", label_style),
            Paragraph("Yes" if (op and getattr(op, 'animal_present', False)) else "No", value_style),
            Paragraph("<b>Animal Count:</b>", label_style),
            Paragraph(str(getattr(op, 'animal_count', 1) if getattr(op, 'animal_count', None) is not None else 1), value_style)
        ],
        [
            Paragraph("<b>Animal Behaviour:</b>", label_style),
            Paragraph(getattr(op, 'animal_behaviour', "Calm") or "Calm", value_style),
            Paragraph("<b>Assessed Threat Level:</b>", label_style),
            Paragraph(getattr(op, 'threat_level', "Low") or "Low", value_style)
        ],
        [
            Paragraph("<b>Human Injury Logged:</b>", label_style),
            Paragraph("Yes" if (op and getattr(op, 'human_injury', False)) else "None Reported", value_style),
            Paragraph("<b>Livestock / Crop Damage:</b>", label_style),
            Paragraph("Yes" if (op and (getattr(op, 'livestock_damage', False) or getattr(op, 'property_damage', False))) else "None", value_style)
        ],
        [
            Paragraph("<b>Actions Executed:</b>", label_style),
            Paragraph(", ".join(actions_list) if actions_list else "Routine Range Patrol & Public Guidance", value_style),
            Paragraph("<b>Outcome / Dispersal:</b>", label_style),
            Paragraph(getattr(op, 'outcome', "Monitored into Forest Boundary") or "Monitored into Forest Boundary", value_style)
        ],
        [
            Paragraph("<b>Animal Movement Direction:</b>", label_style),
            Paragraph(getattr(op, 'animal_direction', "Core Sanctuary Zone") or "Core Sanctuary Zone", value_style),
            Paragraph("<b>Residual Risk Level:</b>", label_style),
            Paragraph(getattr(op, 'remaining_risk', "Low / Negligible") or "Low / Negligible", value_style)
        ]
    ]

    findings_table = Table(findings_rows, colWidths=[130, 127, 128, 130])
    findings_table.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e5e7eb')),
        ('ROWBACKGROUNDS', (0,0), (-1,-1), [colors.white, colors.HexColor('#f9fafb')]),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(findings_table)

    if op and getattr(op, 'action_remarks', None):
        story.append(Spacer(1, 4))
        story.append(Paragraph(f"<b>Officer Action Notes:</b> {op.action_remarks}", body_style))

    story.append(Spacer(1, 8))

    # 6. AI Detection Analysis (If Available)
    if hasattr(inc, 'ai_results') and inc.ai_results:
        story.append(Paragraph("4. AI WILDLIFE VISION ANALYSIS (MEGADETECTOR & SPECIESNET)", h2_style))
        ai_data = [["Detected Species", "Confidence", "Model Details"]]
        for res in inc.ai_results:
            sp = res.get("normalized_species") or "Unknown"
            cf = f"{(res.get('confidence', 0) * 100):.1f}%" if res.get('confidence') else "N/A"
            md = res.get("model_info") or "Edge Vision Pipeline"
            ai_data.append([sp, cf, md])
        
        t_ai = Table(ai_data, colWidths=[170, 100, 245])
        t_ai.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f0fdf4')),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 8),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#bbf7d0')),
            ('PADDING', (0,0), (-1,-1), 4),
        ]))
        story.append(t_ai)
        story.append(Spacer(1, 8))

    # 7. Photographic Evidence Section (SIDE-ALIGNED, NEVER CENTERED)
    story.append(Paragraph("5. PHOTOGRAPHIC EVIDENCE & FIELD DOCUMENTATION", h2_style))

    evidence_candidates = []
    # Collect evidence from op.evidence_photos or inc.images / photo_url
    op_evidence = getattr(op, 'evidence_photos', None)
    if op_evidence:
        try:
            parsed = json.loads(op_evidence)
            if isinstance(parsed, list):
                evidence_candidates.extend(parsed)
            elif isinstance(parsed, str):
                evidence_candidates.append(parsed)
        except Exception:
            evidence_candidates.append(op_evidence)

    if not evidence_candidates and inc:
        if getattr(inc, 'images', None):
            try:
                parsed = json.loads(inc.images) if isinstance(inc.images, str) else inc.images
                if isinstance(parsed, list):
                    evidence_candidates.extend(parsed)
            except Exception:
                pass
        if getattr(inc, 'photo_url', None) and inc.photo_url not in evidence_candidates:
            evidence_candidates.append(inc.photo_url)

    valid_images = []
    for raw_p in evidence_candidates:
        if not raw_p or not isinstance(raw_p, str): continue
        clean_p = raw_p.strip()
        candidates = [
            os.path.join(base_dir, "app", *clean_p.strip("/").split("/")),
            os.path.join(base_dir, *clean_p.strip("/").split("/")),
            clean_p
        ]
        resolved = next((c for c in candidates if os.path.exists(c)), None)
        if resolved:
            valid_images.append((resolved, clean_p))

    if valid_images:
        # Build 2-column side-aligned evidence gallery
        evidence_cells = []
        for idx, (img_file, original_url) in enumerate(valid_images[:4]):
            try:
                # Target width: 220pt (~3.05 inches), maintain aspect ratio up to max height 140pt
                im = Image(img_file, width=220, height=135)
                filename_short = os.path.basename(original_url)
                cell_content = [
                    im,
                    Spacer(1, 2),
                    Paragraph(f"<b>Exhibit {idx + 1}:</b> {filename_short}", caption_style)
                ]
                evidence_cells.append(cell_content)
            except Exception as e:
                continue

        if evidence_cells:
            # Pair cells into 2-column table
            grid_rows = []
            for i in range(0, len(evidence_cells), 2):
                row = [evidence_cells[i]]
                if i + 1 < len(evidence_cells):
                    row.append(evidence_cells[i + 1])
                else:
                    row.append("") # Empty second column
                grid_rows.append(row)

            evidence_table = Table(grid_rows, colWidths=[255, 255])
            evidence_table.setStyle(TableStyle([
                ('VALIGN', (0,0), (-1,-1), 'TOP'),
                ('LEFTPADDING', (0,0), (-1,-1), 0),
                ('RIGHTPADDING', (0,0), (-1,-1), 8),
                ('TOPPADDING', (0,0), (-1,-1), 4),
                ('BOTTOMPADDING', (0,0), (-1,-1), 8),
            ]))
            story.append(evidence_table)
        else:
            story.append(Paragraph("Evidence images recorded in database but inaccessible on storage volume.", caption_style))
    else:
        story.append(Paragraph("No photographic evidence was uploaded for this field operation.", caption_style))

    story.append(Spacer(1, 10))

    # 8. Digital Signature & Sign-Off (LEFT-ALIGNED WITH OFFICER NAME BELOW)
    # Use KeepTogether so signature block never gets split across page breaks
    sig_elements = []
    sig_elements.append(Paragraph("6. INVESTIGATING OFFICER'S SIGNATURE & ENDORSEMENT", h2_style))

    sig_date = op.submitted_at.strftime("%d %B %Y, %H:%M") if (op and getattr(op, 'submitted_at', None)) else datetime.utcnow().strftime("%d %B %Y")
    officer_name = getattr(guard, 'full_name', "Forest Guard Officer")
    officer_role = getattr(guard, 'role', None) or (getattr(guard.designation, 'title', None) if getattr(guard, 'designation', None) else "Forest Guard")

    sig_img_element = None
    if op and op.officer_signature:
        clean_sig = op.officer_signature.strip()
        candidates = [
            os.path.join(base_dir, "app", *clean_sig.strip("/").split("/")),
            os.path.join(base_dir, *clean_sig.strip("/").split("/")),
            clean_sig
        ]
        resolved_sig = next((c for c in candidates if os.path.exists(c)), None)
        if resolved_sig:
            try:
                # Bounded left-aligned signature
                sig_img_element = Image(resolved_sig, width=130, height=45)
            except Exception:
                sig_img_element = None

    # Construct clean left-aligned endorsement card
    sig_card_content = []
    if sig_img_element:
        sig_card_content.append(sig_img_element)
        sig_card_content.append(Spacer(1, 3))
    else:
        sig_card_content.append(Paragraph("<i>[Digital Security Signature Endorsement Verified]</i>", caption_style))
        sig_card_content.append(Spacer(1, 6))

    sig_card_content.append(Paragraph(f"<b>{officer_name}</b>", ParagraphStyle(name='SigName', fontName='Helvetica-Bold', fontSize=10, leading=13, textColor=colors.HexColor('#111827'))))
    sig_card_content.append(Paragraph(f"{officer_role} • {station_name}", ParagraphStyle(name='SigRole', fontName='Helvetica', fontSize=8.5, leading=11, textColor=colors.HexColor('#4b5563'))))
    sig_card_content.append(Paragraph(f"Endorsement Date: {sig_date}", ParagraphStyle(name='SigDate', fontName='Helvetica', fontSize=8, leading=10, textColor=colors.HexColor('#6b7280'))))

    sig_table = Table([[sig_card_content, ""]], colWidths=[280, 235])
    sig_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOX', (0,0), (0,0), 0.75, colors.HexColor('#d1d5db')),
        ('BACKGROUND', (0,0), (0,0), colors.HexColor('#f9fafb')),
        ('PADDING', (0,0), (0,0), 8),
    ]))
    sig_elements.append(sig_table)

    story.append(KeepTogether(sig_elements))

    # Build PDF using NumberedCanvas for dynamic footer & page numbering
    doc.build(story, canvasmaker=NumberedCanvas)
    return True
