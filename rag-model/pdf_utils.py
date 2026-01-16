# pdf_utils.py
from fpdf import FPDF
import os

def save_contract_as_pdf(contract_text: str, output_path: str):
    """
    Saves contract text to a PDF file.
    
    Args:
        contract_text: Full contract as a string (paragraphs separated by \n)
        output_path: Path to save the PDF (e.g., "outputs/contract.pdf")
    """
    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()
    pdf.set_font("Arial", size=12)

    # Split text by paragraphs and add to PDF
    for paragraph in contract_text.split("\n"):
        paragraph = paragraph.strip()
        if paragraph:
            pdf.multi_cell(0, 7, paragraph)
            pdf.ln(3)  # small space between paragraphs

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    pdf.output(output_path)
    return output_path