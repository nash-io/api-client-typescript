import { createHash, randomBytes } from 'crypto'
import FormData from 'form-data'
import {
  RailsAnswerComplianceRequest,
  RailsAnswerComplianceResponse,
  RailsConfirmPersonalInformationRequest,
  RailsConfirmPersonalInformationResponse,
  RailsGetComplianceRequirementsResponse,
  RailsRequestOptions,
  RailsSubmitComplianceDocumentsRequest,
  RailsSubmitComplianceDocumentsResponse,
  RailsSubmitSourceOfFundsRequest,
  RailsSubmitSourceOfFundsResponse
} from '../../types/rails'
import { CustomersClient } from './customers'

type MultipartFormData = FormData & {
  setBoundary(boundary: string): void
}

export class ComplianceClient extends CustomersClient {
  getComplianceRequirements(
    customerId: string
  ): Promise<RailsGetComplianceRequirementsResponse> {
    return this.request('getComplianceRequirements', {
      segments: { customer_id: customerId },
      customerId
    })
  }

  confirmPersonalInformation(
    customerId: string,
    body: RailsConfirmPersonalInformationRequest,
    options?: RailsRequestOptions
  ): Promise<RailsConfirmPersonalInformationResponse> {
    return this.request('confirmPersonalInformation', {
      segments: { customer_id: customerId },
      customerId,
      body,
      options
    })
  }

  submitSourceOfFunds(
    customerId: string,
    body: RailsSubmitSourceOfFundsRequest,
    options?: RailsRequestOptions
  ): Promise<RailsSubmitSourceOfFundsResponse> {
    return this.request('submitSourceOfFunds', {
      segments: { customer_id: customerId },
      customerId,
      body,
      options
    })
  }

  answerComplianceRequest(
    customerId: string,
    requestId: string,
    body: RailsAnswerComplianceRequest,
    options?: RailsRequestOptions
  ): Promise<RailsAnswerComplianceResponse> {
    return this.request('answerComplianceRequest', {
      segments: { customer_id: customerId, request_id: requestId },
      customerId,
      body,
      options
    })
  }

  submitComplianceDocuments(
    customerId: string,
    requestId: string,
    documents: RailsSubmitComplianceDocumentsRequest,
    options?: RailsRequestOptions
  ): Promise<RailsSubmitComplianceDocumentsResponse> {
    const form = new FormData() as MultipartFormData
    const boundary = `--------------------------${randomBytes(24).toString('hex')}`
    form.setBoundary(boundary)
    documents.forEach(document => {
      const fileOptions: { filename: string; contentType?: string } = {
        filename: document.filename
      }
      if (document.contentType !== undefined) {
        fileOptions.contentType = document.contentType
      }
      form.append('documents[]', document.data, fileOptions)
    })

    // ponytail: buffers the full multipart body for exact hashing; spool to disk if unverified upload sizes exceed memory.
    const rawBody = form.getBuffer()
    const digest = createHash('sha256').update(rawBody).digest('hex')
    return this.request('submitComplianceDocuments', {
      segments: { customer_id: customerId, request_id: requestId },
      customerId,
      options,
      rawBody,
      contentType: `multipart/form-data; boundary=${boundary}`,
      contentDigest: digest
    })
  }
}
